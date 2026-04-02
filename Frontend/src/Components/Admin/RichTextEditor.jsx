/**
 * RichTextEditor Component
 * Tiptap-based rich text editor for article content
 * Features: Bold, Italic, Headings, Lists, Links, Images via URL
 */

import React, { useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'

// Toolbar button component
const ToolbarButton = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`rte-toolbar-btn ${isActive ? 'is-active' : ''}`}
  >
    {children}
  </button>
)

// Toolbar separator
const ToolbarSeparator = () => <div className="rte-toolbar-separator" />

// Link modal for adding links
const LinkModal = ({ isOpen, onClose, onSubmit, initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url) {
      onSubmit(url)
      setUrl('')
    }
    onClose()
  }

  return (
    <div className="rte-modal-overlay" onClick={onClose}>
      <div className="rte-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-size-medium text-weight-semibold">Add Link</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="rte-modal-input"
            autoFocus
          />
          <div className="rte-modal-actions">
            <button type="button" onClick={onClose} className="button is-secondary is-small">
              Cancel
            </button>
            <button type="submit" className="button is-small">
              Add Link
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Image modal for adding images via URL
const ImageModal = ({ isOpen, onClose, onSubmit }) => {
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url) {
      onSubmit(url, alt)
      setUrl('')
      setAlt('')
    }
    onClose()
  }

  return (
    <div className="rte-modal-overlay" onClick={onClose}>
      <div className="rte-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-size-medium text-weight-semibold">Add Image</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Image URL (https://...)"
            className="rte-modal-input"
            autoFocus
          />
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Alt text (optional)"
            className="rte-modal-input"
          />
          {url && (
            <div className="rte-image-preview">
              <img src={url} alt={alt || 'Preview'} onError={(e) => e.target.style.display = 'none'} />
            </div>
          )}
          <div className="rte-modal-actions">
            <button type="button" onClick={onClose} className="button is-secondary is-small">
              Cancel
            </button>
            <button type="submit" className="button is-small">
              Add Image
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = 'Start writing your content...',
  minHeight = '300px'
}) {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'rte-link'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rte-image'
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    }
  })

  const addLink = useCallback((url) => {
    if (!editor) return
    
    // If there's no selection, insert the URL as text with link
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${url}</a>`)
        .run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }, [editor])

  const removeLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
  }, [editor])

  const addImage = useCallback((url, alt) => {
    if (!editor) return
    editor.chain().focus().setImage({ src: url, alt: alt || '' }).run()
  }, [editor])

  if (!editor) {
    return <div className="rte-loading">Loading editor...</div>
  }

  return (
    <div className="rte-container">
      {/* Toolbar */}
      <div className="rte-toolbar">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 6 7 8.5C7 11 12 12 12 12"></path>
            <path d="M8 18C8 18 9.5 20 12 20C14.5 20 17 18 17 15.5C17 13 12 12 12 12"></path>
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Blockquote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"></path>
          </svg>
        </ToolbarButton>

        {/* Code block */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('link')) {
              removeLink()
            } else {
              setShowLinkModal(true)
            }
          }}
          isActive={editor.isActive('link')}
          title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </ToolbarButton>

        {/* Image */}
        <ToolbarButton
          onClick={() => setShowImageModal(true)}
          title="Add Image"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent 
        editor={editor} 
        className="rte-content"
        style={{ minHeight }}
      />

      {/* Modals */}
      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSubmit={addLink}
      />
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onSubmit={addImage}
      />

      <style>{`
        .rte-container {
          border: 1px solid #e5e5e7;
          border-radius: 0.5rem;
          overflow: hidden;
          background: white;
          min-width: 0;
        }

        .rte-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          padding: 0.5rem;
          border-bottom: 1px solid #e5e5e7;
          background: #fafbfc;
        }

        .rte-toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 0.25rem;
          color: #666;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        @media (max-width: 767px) {
          .rte-toolbar {
            gap: 0.125rem;
            padding: 0.375rem;
          }
          
          .rte-toolbar-btn {
            width: 28px;
            height: 28px;
            font-size: 0.6875rem;
          }
          
          .rte-toolbar-separator {
            margin: 2px 0.125rem;
            height: 20px;
          }
          
          .rte-content {
            padding: 0.75rem;
          }
        }

        .rte-toolbar-btn:hover:not(:disabled) {
          background: #e5e5e7;
          color: #323539;
        }

        .rte-toolbar-btn.is-active {
          background: #1e65fa;
          color: white;
        }

        .rte-toolbar-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .rte-toolbar-separator {
          width: 1px;
          height: 24px;
          background: #e5e5e7;
          margin: 4px 0.25rem;
        }

        .rte-content {
          padding: 1rem;
        }

        .rte-content .ProseMirror {
          outline: none;
          min-height: inherit;
        }

        .rte-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #aaa;
          float: left;
          height: 0;
          pointer-events: none;
        }

        .rte-content .ProseMirror > * + * {
          margin-top: 0.75rem;
        }

        .rte-content .ProseMirror h1 {
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .rte-content .ProseMirror h2 {
          font-size: 1.375rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .rte-content .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .rte-content .ProseMirror ul,
        .rte-content .ProseMirror ol {
          padding-left: 1.5rem;
        }

        .rte-content .ProseMirror blockquote {
          border-left: 3px solid #1e65fa;
          padding-left: 1rem;
          color: #666;
          font-style: italic;
        }

        .rte-content .ProseMirror pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.875rem;
          overflow-x: auto;
        }

        .rte-content .ProseMirror code {
          background: #f0f0f0;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        .rte-content .ProseMirror pre code {
          background: transparent;
          padding: 0;
        }

        .rte-link {
          color: #1e65fa;
          text-decoration: underline;
          cursor: pointer;
        }

        .rte-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }

        .rte-loading {
          padding: 2rem;
          text-align: center;
          color: #858c95;
        }

        /* Modal styles */
        .rte-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .rte-modal {
          background: white;
          padding: 1.5rem;
          border-radius: 0.75rem;
          width: 100%;
          max-width: 400px;
          margin: 1rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 480px) {
          .rte-modal {
            padding: 1.25rem;
            margin: 0.75rem;
          }
        }

        .rte-modal h3 {
          margin: 0 0 1rem;
        }

        .rte-modal-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e5e7;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }

        .rte-modal-input:focus {
          outline: none;
          border-color: #1e65fa;
        }

        .rte-modal-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .rte-image-preview {
          margin-bottom: 0.75rem;
          border-radius: 0.5rem;
          overflow: hidden;
          max-height: 150px;
        }

        .rte-image-preview img {
          width: 100%;
          height: auto;
          object-fit: cover;
        }
      `}</style>
    </div>
  )
}
