import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

const ImageModal = ({ src, onClose, onDelete }) => {
    const [zoom, setZoom] = useState(false);
    if (!src) return null;
    return (
        <div className="fixed inset-0 bg-black z-[120] flex flex-col justify-center items-center p-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-white/20 p-3 rounded-full">
                <X />
            </button>
            <div
                className={`overflow-auto ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'} w-full h-full flex items-center justify-center`}
                onClick={() => setZoom((z) => !z)}
            >
                <img
                    src={src}
                    className={`object-contain transition-transform duration-150 ${zoom ? 'scale-125 max-w-none max-h-none' : 'max-w-full max-h-[80vh]'}`}
                    alt="Bill"
                />
            </div>
            <div className="mt-4 flex gap-3">
                <button onClick={onDelete} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex gap-2">
                    <Trash2 /> Delete Photo
                </button>
                <button onClick={() => setZoom((z) => !z)} className="bg-white text-black px-4 py-2 rounded">
                    {zoom ? 'Exit Zoom' : 'Zoom'}
                </button>
            </div>
        </div>
    );
};

export default ImageModal;