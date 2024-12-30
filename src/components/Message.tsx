import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import type { Message as MessageType } from '@/types'

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  return (
    <Card className={`mb-4 ${message.role === 'assistant' ? 'bg-blue-50' : ''}`}>
      <CardContent className="p-4">
        <p className="mb-2">{message.content}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2">
            <h4 className="font-semibold text-sm mb-1">Citations:</h4>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {citation.text}: {citation.reference}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

