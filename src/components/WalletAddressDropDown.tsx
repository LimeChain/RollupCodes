import { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'

interface WalletAddressDropdownProps {
  address: string
  onDisconnect: () => void
  className?: string
}

export function WalletAddressDropdown({ address, onDisconnect, className }: WalletAddressDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])
  
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Wallet Address Display */}
      <div className="inline-flex items-center gap-1 justify-end">
        <span
          className="text-sm font-normal text-foreground"
          style={{ lineHeight: '14px' }}
          aria-label={`Connected wallet address: ${address}`}
        >
          {address}
        </span>

        {/* Three Dots Icon Button - Only this is clickable */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          style={{ background: 'none', border: 'none', padding: 0, margin: 0, display: 'inline-flex', alignItems: 'center', overflow: 'visible' }}
          className="cursor-pointer transition-colors duration-200 text-neutral-500 hover:text-neutral-400"
          aria-label="Wallet options menu"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <MoreVertical className="w-2 h-2" style={{ transform: 'translateY(3px)' }} aria-hidden="true" />
        </button>
      </div>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          role="menu"
          aria-label="Wallet actions"
          className="absolute top-full right-0 mt-1 min-w-dropdown border border-border bg-background z-50"
        >
          <button
            role="menuitem"
            onClick={() => {
              onDisconnect()
              setIsOpen(false)
            }}
            className="w-full px-4 py-2.5 text-left text-sm leading-body transition-colors duration-200 min-h-touch text-foreground hover:bg-hover-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
