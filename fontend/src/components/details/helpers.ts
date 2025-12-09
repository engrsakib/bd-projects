import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  ExternalLink,
} from "lucide-react"

export const getSocialIcon = (name: string) => {
  const iconName = name?.toLowerCase()
  switch (iconName) {
    case "facebook":
      return Facebook
    case "instagram":
      return Instagram
    case "twitter":
      return Twitter
    case "youtube":
      return Youtube
    case "linkedin":
      return Linkedin
    default:
      return ExternalLink
  }
}

export const makeAttributesPayload = (
  variant: any,
  selectedAttributes: Record<string, string>
) => {
  const vals = variant?.attribute_values || {}
  const payload: Record<string, string> = {}
  if (vals.Size) payload.size = vals.Size
  if (vals.Color) payload.color = vals.Color
  Object.entries(selectedAttributes).forEach(([k, v]) => {
    const key = k.toLowerCase()
    if (!payload[key]) payload[key] = v
  })
  return payload
}
