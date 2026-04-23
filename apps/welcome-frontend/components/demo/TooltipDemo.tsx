import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">Hover me</button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" sideOffset={5}>
        <p>This is a tooltip content!</p>
      </TooltipContent>
    </Tooltip>
  )
}
