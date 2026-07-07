import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect } from 'react'

const btn = (active) =>
  `px-2 py-1 rounded text-sm transition-colors ${active
    ? 'bg-blue-600 text-white'
    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`

export default function RichTextEditor({ value, onChange, disabled, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false, code: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'min-h-[80px] px-3 py-2 text-sm outline-none prose prose-sm dark:prose-invert max-w-none',
      },
    },
  })

  // sync external value changes (e.g. reset form)
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? '' : editor.getHTML()
    if ((value ?? '') !== current) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  useEffect(() => {
    if (editor) editor.setEditable(!disabled)
  }, [disabled, editor])

  if (!editor) return null

  return (
    <div className={`border rounded-lg overflow-hidden ${disabled ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}`}>
      {!disabled && (
        <div className="flex flex-wrap gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
            className={btn(editor.isActive('bold'))} title="Negrito">
            <strong>N</strong>
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btn(editor.isActive('italic'))} title="Itálico">
            <em>I</em>
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={btn(editor.isActive('underline'))} title="Sublinhado">
            <span className="underline">S</span>
          </button>
          <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={btn(editor.isActive({ textAlign: 'left' }))} title="Alinhar à esquerda">
            ≡
          </button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={btn(editor.isActive({ textAlign: 'center' }))} title="Centralizar">
            ☰
          </button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={btn(editor.isActive({ textAlign: 'right' }))} title="Alinhar à direita">
            ≡
          </button>
          <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
          <button type="button" onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()} title="Desfazer"
            className={`${btn(false)} disabled:opacity-40`}>
            ↩
          </button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()} title="Refazer"
            className={`${btn(false)} disabled:opacity-40`}>
            ↪
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      {!editor.getText() && placeholder && !disabled && (
        <div className="pointer-events-none px-3 pb-2 text-sm text-gray-400 dark:text-gray-500 -mt-8">{placeholder}</div>
      )}
    </div>
  )
}
