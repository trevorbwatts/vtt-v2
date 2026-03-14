import React, { useEffect } from 'react'
import { Image } from 'react-konva'
import useImage from 'use-image'

interface MapLayerProps {
  imageUrl: string
  onImageSize?: (width: number, height: number) => void
}

export function MapImageNode({ imageUrl, onImageSize }: MapLayerProps): React.ReactElement | null {
  const [image] = useImage(imageUrl)

  useEffect(() => {
    if (image && onImageSize) {
      onImageSize(image.naturalWidth, image.naturalHeight)
    }
  }, [image, onImageSize])

  if (!image) return null
  return <Image image={image} x={0} y={0} />
}
