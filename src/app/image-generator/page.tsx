'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Download, Image as ImageIcon } from "lucide-react"

const IMAGE_FORMATS = {
  'og': { width: 1200, height: 630, label: 'Social Media OG' },
  'youtube': { width: 1280, height: 720, label: 'YouTube Poster' },
  'twitter': { width: 1200, height: 675, label: 'Twitter Post' },
  'email': { width: 600, height: 400, label: 'Email Banner' },
  'banner': { width: 1600, height: 400, label: 'Wide Banner' },
}

const VERCEL_BACKGROUNDS = [
  { id: 'solid-black', name: 'Solid Black', color: '#000000' },
  { id: 'solid-white', name: 'Solid White', color: '#FFFFFF' },
  { id: 'gradient-dark', name: 'Dark Gradient', gradient: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)' },
  { id: 'gradient-vercel', name: 'Vercel Gradient', gradient: 'linear-gradient(135deg, #000000 0%, #0070f3 100%)' },
  { id: 'gradient-purple', name: 'Purple Gradient', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient-ocean', name: 'Ocean Gradient', gradient: 'linear-gradient(135deg, #667eea 0%, #0070f3 100%)' },
  { id: 'gradient-sunset', name: 'Sunset Gradient', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient-mint', name: 'Mint Gradient', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
]

type Position = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
type LogoType = 'logotype' | 'icon'

const BASE_URL = 'https://d1x0zcqhnlqelh.cloudfront.net/images/69d2b268e16ef23a7e81dd3abc50ec84/Vercel%20Logos/'

export default function ImageGenerator() {
  const [text, setText] = useState('Build and ship with Vercel')
  const [format, setFormat] = useState('og')
  const [textPosition, setTextPosition] = useState<Position>('middle-center')
  const [logoPosition, setLogoPosition] = useState<Position>('bottom-left')
  const [logoType, setLogoType] = useState<LogoType>('logotype')
  const [showLogo, setShowLogo] = useState(true)
  const [logoSize, setLogoSize] = useState(12)
  const [textSize, setTextSize] = useState(8)
  const [selectedBackground, setSelectedBackground] = useState('solid-black')
  const [customBackground, setCustomBackground] = useState<string | null>(null)
  const [textColor, setTextColor] = useState('#FFFFFF')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [vercelLogo, setVercelLogo] = useState<HTMLImageElement | null>(null)

  const isDarkBg = selectedBackground.includes('dark') || selectedBackground === 'solid-black' || selectedBackground.includes('vercel')

  useEffect(() => {
    const loadImage = () => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = `${BASE_URL}vercel-${logoType}-${isDarkBg ? 'light' : 'dark'}.png`
      img.onload = () => setVercelLogo(img)
    }
    loadImage()
  }, [logoType, isDarkBg])

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = IMAGE_FORMATS[format as keyof typeof IMAGE_FORMATS]
    canvas.width = width
    canvas.height = height

    // Draw background
    if (customBackground) {
      const img = new Image()
      img.src = customBackground
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        drawContent(ctx, width, height)
      }
    } else {
      const bg = VERCEL_BACKGROUNDS.find(b => b.id === selectedBackground)
      if (bg) {
        if (bg.gradient) {
          const gradient = ctx.createLinearGradient(0, 0, width, height)
          const colors = bg.gradient.match(/#[0-9a-f]{6}/gi) || ['#000000', '#000000']
          gradient.addColorStop(0, colors[0])
          gradient.addColorStop(1, colors[1])
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = bg.color || '#000000'
        }
        ctx.fillRect(0, 0, width, height)
      }
      drawContent(ctx, width, height)
    }
  }, [text, format, vercelLogo, textPosition, logoPosition, logoSize, textSize, selectedBackground, customBackground, showLogo, textColor, logoType, isDarkBg])

  const drawContent = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw logo
    if (showLogo && vercelLogo) {
      const logoHeight = Math.min(height * (logoSize / 100), height)
      const logoWidth = (logoHeight / vercelLogo.height) * vercelLogo.width
      const [logoX, logoY] = getPosition(logoPosition, width, height, logoWidth, logoHeight)
      ctx.drawImage(vercelLogo, logoX, logoY, logoWidth, logoHeight)
    }

    // Draw text
    ctx.fillStyle = textColor
    ctx.textBaseline = 'top'

    const fontSize = Math.floor(height * (textSize / 100))
    ctx.font = `bold ${fontSize}px "Geist", -apple-system, BlinkMacSystemFont, sans-serif`

    const padding = Math.floor(width / 20)
    const maxWidth = width - (padding * 2)
    const words = text.split(' ')
    const lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i]
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth) {
        lines.push(currentLine)
        currentLine = words[i]
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)

    const lineHeight = fontSize * 1.3
    const totalTextHeight = lines.length * lineHeight

    let textX: number
    let textY: number

    switch (textPosition) {
      case 'top-left':
      case 'middle-left':
      case 'bottom-left':
        textX = padding
        ctx.textAlign = 'left'
        break
      case 'top-center':
      case 'middle-center':
      case 'bottom-center':
        textX = width / 2
        ctx.textAlign = 'center'
        break
      case 'top-right':
      case 'middle-right':
      case 'bottom-right':
        textX = width - padding
        ctx.textAlign = 'right'
        break
    }

    switch (textPosition) {
      case 'top-left':
      case 'top-center':
      case 'top-right':
        textY = padding
        break
      case 'middle-left':
      case 'middle-center':
      case 'middle-right':
        textY = (height - totalTextHeight) / 2
        break
      case 'bottom-left':
      case 'bottom-center':
      case 'bottom-right':
        textY = height - totalTextHeight - padding
        break
    }

    lines.forEach((line, index) => {
      ctx.fillText(line, textX, textY + index * lineHeight)
    })
  }

  useEffect(() => {
    if (canvasRef.current) {
      drawImage()
    }
  }, [drawImage])

  const handleExport = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const link = document.createElement('a')
      link.download = `vercel-image-${format}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error("Failed to export image:", error)
      alert("Failed to export image. Please try again.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCustomBackground(event.target?.result as string)
        setSelectedBackground('custom')
      }
      reader.readAsDataURL(file)
    }
  }

  const getPosition = (position: Position, width: number, height: number, elementWidth: number, elementHeight: number): [number, number] => {
    const padding = Math.floor(width / 20)
    let x: number, y: number
    switch (position) {
      case 'top-left':
        x = padding
        y = padding
        break
      case 'top-center':
        x = (width - elementWidth) / 2
        y = padding
        break
      case 'top-right':
        x = width - elementWidth - padding
        y = padding
        break
      case 'middle-left':
        x = padding
        y = (height - elementHeight) / 2
        break
      case 'middle-center':
        x = (width - elementWidth) / 2
        y = (height - elementHeight) / 2
        break
      case 'middle-right':
        x = width - elementWidth - padding
        y = (height - elementHeight) / 2
        break
      case 'bottom-left':
        x = padding
        y = height - elementHeight - padding
        break
      case 'bottom-center':
        x = (width - elementWidth) / 2
        y = height - elementHeight - padding
        break
      case 'bottom-right':
        x = width - elementWidth - padding
        y = height - elementHeight - padding
        break
    }
    return [x, y]
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Image Generator</h1>
        <p className="text-muted-foreground">Create branded marketing images with customizable layouts and backgrounds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Text Settings */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Text Content</Label>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your text..."
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Position</Label>
                  <Select value={textPosition} onValueChange={(value: Position) => setTextPosition(value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map((pos) => (
                        <SelectItem key={pos} value={pos}>{pos.split('-').join(' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTextColor('#FFFFFF')}
                      className={`h-9 w-9 rounded border-2 ${textColor === '#FFFFFF' ? 'border-foreground' : 'border-border'}`}
                      style={{ background: '#FFFFFF' }}
                    />
                    <button
                      onClick={() => setTextColor('#000000')}
                      className={`h-9 w-9 rounded border-2 ${textColor === '#000000' ? 'border-foreground' : 'border-border'}`}
                      style={{ background: '#000000' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Text Size: {textSize}%</Label>
                <Slider
                  min={4}
                  max={20}
                  step={1}
                  value={[textSize]}
                  onValueChange={(value) => setTextSize(value[0])}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Settings */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Vercel Logo</Label>
                <button
                  onClick={() => setShowLogo(!showLogo)}
                  className="text-xs px-3 py-1 rounded-md bg-accent hover:bg-accent/80 transition-colors"
                >
                  {showLogo ? 'Hide' : 'Show'}
                </button>
              </div>

              {showLogo && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Type</Label>
                      <Select value={logoType} onValueChange={(value: LogoType) => setLogoType(value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logotype">Logotype</SelectItem>
                          <SelectItem value="icon">Icon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Position</Label>
                      <Select value={logoPosition} onValueChange={(value: Position) => setLogoPosition(value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map((pos) => (
                            <SelectItem key={pos} value={pos}>{pos.split('-').join(' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Logo Size: {logoSize}%</Label>
                    <Slider
                      min={5}
                      max={30}
                      step={1}
                      value={[logoSize]}
                      onValueChange={(value) => setLogoSize(value[0])}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Format Settings */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Image Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMAGE_FORMATS).map(([key, { width, height, label }]) => (
                      <SelectItem key={key} value={key}>
                        {label} ({width}×{height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Background Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Background Selection */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Background</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Custom
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                {VERCEL_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      setSelectedBackground(bg.id)
                      setCustomBackground(null)
                    }}
                    className={`h-16 rounded-lg border-2 transition-all ${
                      selectedBackground === bg.id ? 'border-foreground ring-2 ring-ring' : 'border-border hover:border-foreground/50'
                    }`}
                    style={{
                      background: bg.gradient || bg.color,
                    }}
                    title={bg.name}
                  />
                ))}
                {customBackground && (
                  <button
                    onClick={() => setSelectedBackground('custom')}
                    className={`h-16 rounded-lg border-2 transition-all ${
                      selectedBackground === 'custom' ? 'border-foreground ring-2 ring-ring' : 'border-border hover:border-foreground/50'
                    }`}
                    style={{
                      backgroundImage: `url(${customBackground})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    title="Custom Background"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-semibold">Preview</Label>
                <Button onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export PNG
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-4 overflow-auto">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto border border-border rounded shadow-lg"
                  style={{ maxHeight: '600px' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
