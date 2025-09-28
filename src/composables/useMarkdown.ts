import { marked } from 'marked'
import type { Message, ContextItem } from '@/types/chat'

// Configure marked options for better security and styling
marked.setOptions({
  breaks: true,
  gfm: true,
})

export function useMarkdown() {
  const parseMarkdown = (content: string): string => {
    const result = marked(content)
    return typeof result === 'string' ? result : ''
  }

  const formatMessageWithContext = (
    content: string,
    context: ContextItem[]
  ): string => {
    if (!context.length) return content

    const contextSection = context
      .map((item) => {
        if (item.type === 'code') {
          return `**${item.title}**\n\`\`\`${item.language}\n${item.content}\n\`\`\``
        } else if (item.type === 'file') {
          return `**${item.title}**\n\`\`\`\n${item.content}\n\`\`\``
        } else {
          return `**${item.title}**\n${item.content}`
        }
      })
      .join('\n\n')

    return content ? `${content}\n\n---\n\n${contextSection}` : contextSection
  }

  const createMessage = (
    content: string,
    role: Message['role'],
    context?: ContextItem[]
  ): Message => {
    return {
      id: Date.now(),
      role,
      content: context ? formatMessageWithContext(content, context) : content,
      timestamp: new Date(),
      context,
    }
  }

  return {
    parseMarkdown,
    formatMessageWithContext,
    createMessage,
  }
}
