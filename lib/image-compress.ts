/**
 * 图片压缩工具
 * 当图片大于 3MB 时自动压缩
 */

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const COMPRESS_QUALITY = 0.7; // 压缩质量
const MAX_DIMENSION = 1920; // 最大宽度/高度

export interface CompressResult {
    file: File;
    wasCompressed: boolean;
    originalSize: number;
    compressedSize: number;
}

/**
 * 压缩图片
 * @param file 原始文件
 * @returns 压缩后的文件信息
 */
export async function compressImage(file: File): Promise<CompressResult> {
    const originalSize = file.size;

    // 如果文件小于 3MB，不压缩
    if (file.size <= MAX_FILE_SIZE) {
        return {
            file,
            wasCompressed: false,
            originalSize,
            compressedSize: originalSize,
        };
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // 计算压缩后的尺寸
                let width = img.width;
                let height = img.height;

                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width > height) {
                        height = Math.round((height * MAX_DIMENSION) / width);
                        width = MAX_DIMENSION;
                    } else {
                        width = Math.round((width * MAX_DIMENSION) / height);
                        height = MAX_DIMENSION;
                    }
                }

                // 创建 canvas 进行压缩
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);

                // 统一使用 JPEG 格式压缩，确保兼容性
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // 如果压缩后仍然大于 3MB，降低质量再次压缩
                        if (blob.size > MAX_FILE_SIZE) {
                            compressWithLowerQuality(img, width, height, COMPRESS_QUALITY * 0.5)
                                .then((result) => resolve({
                                    file: result,
                                    wasCompressed: true,
                                    originalSize,
                                    compressedSize: result.size,
                                }))
                                .catch(reject);
                        } else {
                            // 生成新的文件名，确保扩展名正确
                            const baseName = file.name.replace(/\.[^/.]+$/, '');
                            const compressedFile = new File([blob], `${baseName}.jpg`, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });

                            resolve({
                                file: compressedFile,
                                wasCompressed: true,
                                originalSize,
                                compressedSize: compressedFile.size,
                            });
                        }
                    },
                    'image/jpeg',
                    COMPRESS_QUALITY
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * 使用更低质量压缩图片
 */
function compressWithLowerQuality(
    img: HTMLImageElement,
    width: number,
    height: number,
    quality: number
): Promise<File> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Failed to compress image'));
                    return;
                }

                const file = new File([blob], 'compressed.jpg', {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });

                resolve(file);
            },
            'image/jpeg',
            quality
        );
    });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
