import Head from 'next/head'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardHeader, CardContent, Card } from '@/components/ui/card'
import imageCompression from 'browser-image-compression'
import { useState, useEffect } from 'react'

export default function components() {
    const [imagePreview, setImagePreview] = useState(
    )
    const [compressing, setCompressing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState({ data: '', error: '' })
    const [selectedFile, setSelectedFile] = useState(null)

    useEffect(() => {
        const pasteHandler = async event => {
            const items = (event.clipboardData || window.clipboardData).items
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile()
                    const file = new File([blob], 'pastedImage.jpg', { type: 'image/jpeg' })
                    await previewImage({ target: { files: [file] } })
                    break
                }
            }
        }

        window.addEventListener('paste', pasteHandler)
        return () => {
            window.removeEventListener('paste', pasteHandler)
        }
    }, [])

    const previewImage = async event => {
        const file = event.target.files[0]
        const validTypes = ['image/png', 'image/jpeg', 'image/webp']

        if (file && validTypes.includes(file.type)) {
            const options = {
                maxSizeMB: 10,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            }
            try {
                setCompressing(true)
                const compressedFile = await imageCompression(file, options)
                const reader = new FileReader()
                reader.onloadend = async () => {
                    setImagePreview(reader.result)
                    setCompressing(false)
                    setSelectedFile(compressedFile)
                    submitForm(compressedFile)
                }
                reader.readAsDataURL(compressedFile)
            } catch (error) {
                console.error('Error during compression', error)
                alert('Cannot compress the image.')
                setCompressing(false)
            }
        } else {
            alert('Please select an image file (png, jpeg, webp).')
            setImagePreview('')
        }
    }

    const submitForm = async file => {
        setLoading(true)

        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            timeout: 50000
        })
        if (!response.ok) {
            const errorData = await response.json()
            setResult({ data: '我好像没有识别出来，换一张图片或者重新上传！', error: errorData.error })
            setLoading(false)
            return
        }
        const data = await response.json()
        setResult({ data: data.result, error: '' })
        setLoading(false)
    }

    return (
        <div className="container">
            <Head>
                <title>我来告诉你这是什么植物！</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <main className="flex flex-col items-center justify-center min-h-screen py-2">
                <Card className="max-w-md ">
                    <CardHeader>
                        <div className="flex items-center">
                            <h2 className="text-2xl font-bold">我来告诉你这是什么植物！</h2>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {compressing ? (
                            <div style={{ textAlign: 'center' }}>Scaning image...</div>
                        ) : (
                            imagePreview && (
                                <img
                                    alt="Analyzed cat image"
                                    className="aspect-content object-cover"
                                    height="500"
                                    src={imagePreview}
                                    width="500"
                                />
                            )
                        )}
                        <div className="mt-4 rounded-lg p-4">
                            <p className="ml-2 text-lg" style={{ textAlign: 'center' }}>
                                {compressing
                                    ? '🌿🌿🌿🌿🌿🌿'
                                    : loading
                                    ? '让我帮你看看这是什么植物呢...'
                                    : result.error
                                    ? `好像我无法识别这是什么植物，请重试或换一张图片！`
                                    : result.data ||
                                      '🌿: 这是一株盛开的樱花树'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <div className="w-full max-w-md px-2 py-2">
                    <form
                        onSubmit={e => {
                            e.preventDefault()
                            submitForm(selectedFile)
                        }}
                        encType="multipart/form-data"
                    >
                        <div className="grid w-full gap-4 mt-4">
                            <Label htmlFor="catImage">上传植物的照片，AI告诉你这是什么植物~</Label>
                            <Input
                                required
                                id="catImage"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={previewImage}
                            />
                            <Button type="submit" variant="dark" disabled={loading || compressing}>
                                {compressing ? '识别图像中' : loading ? '识别图像中' : '让我帮你看看这是什么植物呢'}
                            </Button>
                        </div>
                    </form>
                </div>
                <p className="tip mt-4">本服务不会收集、存储或使用任何与图片相关的个人信息</p>
            </main>
        </div>
    )
}