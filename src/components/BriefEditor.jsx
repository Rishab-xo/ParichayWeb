import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

import { exportDocument } from '../utils/api';

const BriefEditor = ({ initialMarkdown = '' }) => {
    const [isExporting, setIsExporting] = useState(false);

    // Initialize TipTap with the Markdown extension
    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
        ],
        content: initialMarkdown,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] border p-6 rounded-md bg-white brief-editor-content',
            },
        },
    });

    const handleExport = async (format) => {
        if (!editor) return;
        
        setIsExporting(true);
        
        // Extract the final, human-edited state as HTML
        const finalHtml = editor.getHTML();

        try {
            const blob = await exportDocument(format, finalHtml);

            // Trigger browser download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Legal_Brief.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error(`Failed to export ${format}:`, error);
            alert(`Document export failed: ${error.message || 'Please try again.'}`);
        } finally {
            setIsExporting(false);
        }
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="brief-editor-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
            {/* Toolbar / Actions */}
            <div 
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    marginBottom: '16px'
                }}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>Review & Edit Brief</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => handleExport('docx')}
                        disabled={isExporting}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontWeight: 500,
                            opacity: isExporting ? 0.5 : 1,
                            cursor: isExporting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Download DOCX
                    </button>
                    <button 
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontWeight: 500,
                            opacity: isExporting ? 0.5 : 1,
                            cursor: isExporting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Download PDF
                    </button>
                </div>
            </div>

            {/* TipTap Rich Text Canvas */}
            <div 
                style={{
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '24px',
                    minHeight: '500px'
                }}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default BriefEditor;
