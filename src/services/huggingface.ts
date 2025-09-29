export interface HFModelCard {
  _id: string
  id: string
  downloads?: number
  likes?: number
  trendingScore?: number
  private?: boolean
  tags?: string[]
  pipeline_tag?: string
  createdAt?: string
  modelId?: string
}

export interface HFModelFile {
  rfilename: string
  sha256?: string
  lastCommittedDate?: string
}

export interface HFModelInfo {
  id: string
  downloads: number
  likes: number
  lastModified: string
  files: HFModelFile[]
}

export interface LMStudioCatalogItem {
  name: string
  size: number
  digest: string
  modified_at: string
  downloads?: number
  likes?: number
  details?: {
    format: string
    family: string
    parameter_size: string
    quantization_level: string
  }
}

const HF_API_BASE = 'https://huggingface.co/api'

function extractFamilyAndParams(modelId: string): { family: string; parameter_size: string } {
  const lower = modelId.toLowerCase()
  if (lower.includes('llama'))
    return {
      family: 'llama',
      parameter_size: lower.match(/(\d+(?:\.\d+)?b)/)?.[1]?.toUpperCase() || '',
    }
  if (lower.includes('mistral'))
    return {
      family: 'mistral',
      parameter_size: lower.match(/(\d+(?:\.\d+)?b)/)?.[1]?.toUpperCase() || '',
    }
  if (lower.includes('qwen'))
    return {
      family: 'qwen',
      parameter_size: lower.match(/(\d+(?:\.\d+)?b)/)?.[1]?.toUpperCase() || '',
    }
  if (lower.includes('gemma'))
    return {
      family: 'gemma',
      parameter_size: lower.match(/(\d+(?:\.\d+)?b)/)?.[1]?.toUpperCase() || '',
    }
  if (lower.includes('phi'))
    return {
      family: 'phi',
      parameter_size: lower.match(/(\d+(?:\.\d+)?b)/)?.[1]?.toUpperCase() || '',
    }
  return { family: 'unknown', parameter_size: '' }
}

function extractQuant(rfilename: string): string {
  const match = rfilename.match(/-(Q\d(?:_\d)?|q\d(?:_\d)?)/)
  return match ? match[1].toUpperCase() : ''
}

export async function searchGGUFTextGenModels(limit = 50): Promise<LMStudioCatalogItem[]> {
  // Try a simpler search first to avoid CORS issues
  const searchUrl = `${HF_API_BASE}/models?limit=${encodeURIComponent(String(limit))}&search=gguf&sort=downloads&direction=-1`

  try {
    const res = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
      mode: 'cors',
    })

    if (!res.ok) {
      console.error('HF API request failed:', res.status, res.statusText)
      return []
    }

    const cards: HFModelCard[] = await res.json()
    console.log('HF API returned', cards.length, 'models')

    if (!Array.isArray(cards)) {
      console.error('HF API returned non-array response:', cards)
      return []
    }

    // Filter to repos that look like quantized instruct chat models where possible
    const candidateCards = cards
      .filter((c) => (c.tags || []).some((t) => t.toLowerCase().includes('gguf')))
      .filter((c) => !c.private) // Exclude private models

    console.log('Filtered to', candidateCards.length, 'candidate models with GGUF tags')

    // Fetch repo files to locate .gguf artifacts
    const results: LMStudioCatalogItem[] = []
    await Promise.all(
      candidateCards.map(async (card) => {
        const repoId = card.id
        try {
          const filesRes = await fetch(
            `${HF_API_BASE}/models/${encodeURIComponent(repoId)}?full=true`,
            { mode: 'cors' },
          )
          if (!filesRes.ok) {
            console.warn('Failed to fetch model details for', repoId, filesRes.status)
            return
          }
          const info: {
            siblings?: HFModelFile[]
            files?: HFModelFile[]
            lastModified?: string
            downloads?: number
            likes?: number
          } = await filesRes.json()

          const files: HFModelFile[] = Array.isArray(info?.siblings)
            ? info.siblings
            : Array.isArray(info?.files)
              ? info.files
              : []

          const ggufFiles = files.filter(
            (f) => f.rfilename && f.rfilename.toLowerCase().endsWith('.gguf'),
          )
          // Prefer instruct/chat variants if present
          const sorted = ggufFiles.sort((a, b) => {
            const aI = /instruct|chat|it/i.test(a.rfilename) ? 0 : 1
            const bI = /instruct|chat|it/i.test(b.rfilename) ? 0 : 1
            return aI - bI
          })
          const top = sorted[0]
          if (!top) return

          const { family, parameter_size } = extractFamilyAndParams(repoId)
          const quantization_level = extractQuant(top.rfilename)

          results.push({
            name: repoId,
            size: 0, // HF API doesn't provide file sizes
            digest: top.sha256 || '',
            modified_at:
              top.lastCommittedDate ||
              info?.lastModified ||
              card.createdAt ||
              new Date().toISOString(),
            downloads: info.downloads || card.downloads || 0,
            likes: info.likes || card.likes || 0,
            details: {
              format: 'gguf',
              family,
              parameter_size: parameter_size || '',
              quantization_level: quantization_level || '',
            },
          })
        } catch (error) {
          console.warn('Error processing model', repoId, error)
        }
      }),
    )

    console.log('Found', results.length, 'models with GGUF files')

    // De-dup by repo id
    const seen = new Set<string>()
    const finalResults = results.filter((r) => {
      if (seen.has(r.name)) return false
      seen.add(r.name)
      return true
    })

    console.log('Final results:', finalResults.length, 'unique models')
    return finalResults
  } catch (error) {
    console.error('Failed to fetch models from Hugging Face:', error)
    return []
  }
}

// Helper function to get available model tags for better filtering
export async function getModelTags(): Promise<Record<string, string[]>> {
  try {
    const res = await fetch(`${HF_API_BASE}/models-tags-by-type`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}
