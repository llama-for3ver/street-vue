<template>
    <div class="street-view-panorama" ref="panoramaContainer">
        <canvas class="touch-none w-full" ref="svcanvas" id="svcanvas" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import * as THREE from 'three';

const baseUrl = "https://streetviewpixels-pa.googleapis.com/v1/tile";
const props = defineProps(['panoId', 'zoom']);

const panoramaContainer = ref<HTMLDivElement | null>(null);
const svcanvas = ref<HTMLCanvasElement | null>(null);

let panoId = props.panoId;

// console.log(panoId)
// panoId = "QO1VfbL8kpdJr5p5szXjww";
// QO1VfbL8kpdJr5p5szXjww
// FeUaBDXEVnjfwlKKAJzaDg

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let sphere: THREE.Mesh;

let isUserInteracting = false;
let onPointerDownMouseX = 0;
let onPointerDownMouseY = 0;
let lon = 0;
let onPointerDownLon = 0;
let lat = 0;
let onPointerDownLat = 0;
let phi = 0;
let theta = 0;

let baseSensitivity = 0.15;

const tiles = (zoom: number): number[] => {
    return [2 ** zoom, 2 ** (zoom - 1)];
};

const loadPanorama = async () => {
    const start = Date.now();
    const zoom = props.zoom;
    const [width, height] = tiles(zoom);
    const tileSize = 512;
    const overlapPixels = 0;

    let canvas = document.createElement('canvas');
    canvas.width = width * tileSize;
    canvas.height = height * tileSize;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

    const loadTile = (x: number, y: number) => {
        return new Promise((resolve, reject) => {
            // FIXME: error handling

            const tileUrl = `${baseUrl}?cb_client=maps_sv.tactile&panoid=${panoId}&x=${x}&y=${y}&zoom=${zoom}`;
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const xPos = x * tileSize;
                const yPos = y * tileSize;

                ctx.drawImage(img, xPos, yPos);

                const shouldWrapHorizontally = x === width - 1;
                const shouldWrapVertically = y === height - 1;

                if (shouldWrapHorizontally) {
                    ctx.drawImage(
                        img,
                        0, 0, overlapPixels, tileSize,
                        canvas.width - overlapPixels, yPos,
                        overlapPixels, tileSize
                    );
                }

                if (shouldWrapVertically) {
                    ctx.drawImage(
                        img,
                        0, 0, tileSize, overlapPixels,
                        xPos, canvas.height - overlapPixels,
                        tileSize, overlapPixels
                    );
                }

                if (shouldWrapHorizontally && shouldWrapVertically) {
                    ctx.drawImage(
                        img,
                        0, 0, overlapPixels, overlapPixels,
                        canvas.width - overlapPixels, canvas.height - overlapPixels,
                        overlapPixels, overlapPixels
                    );
                }

                resolve(void 0);
            };

            img.onerror = () => reject(new Error(`Failed to load tile at x:${x}, y:${y}`));
            img.src = tileUrl;
        });
    };

    const promises = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            promises.push(loadTile(x, y));
        }
    }

    try {
        await Promise.all(promises);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { width: actualWidth, height: actualHeight } = fixDimensions(imageData);

        if (actualWidth < canvas.width || actualHeight < canvas.height) {
            const trimmedCanvas = document.createElement('canvas');
            trimmedCanvas.width = actualWidth;
            trimmedCanvas.height = actualHeight;
            const trimmedCtx: CanvasRenderingContext2D = trimmedCanvas.getContext('2d') as CanvasRenderingContext2D;
            trimmedCtx.drawImage(canvas, 0, 0);
            canvas = trimmedCanvas;
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;

        if (renderer.capabilities.isWebGL2) {
            texture.unpackAlignment = 1;
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearFilter;
        }

        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        console.log(`Panorama loaded in: ${Date.now() - start}ms`);
    } catch (error) {
        console.error('Panorama loading failed:', error);
    }
};


const fixDimensions = (imageData: ImageData) => {
    const { data, width, height } = imageData;
    let rightmostNonBlackPixel = 0;
    let bottommostNonBlackPixel = 0;

    for (let x = width - 1; x >= 0; x--) {
        let isBlackColumn = true;
        for (let y = 0; y < height; y++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            if (r > 0 || g > 0 || b > 0) {
                isBlackColumn = false;
                break;
            }
        }
        if (!isBlackColumn) {
            rightmostNonBlackPixel = x + 1;
            break;
        }
    }

    for (let y = height - 1; y >= 0; y--) {
        let isBlackRow = true;
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            if (r > 0 || g > 0 || b > 0) {
                isBlackRow = false;
                break;
            }
        }
        if (!isBlackRow) {
            bottommostNonBlackPixel = y + 1;
            break;
        }
    }

    return {
        width: rightmostNonBlackPixel || width,
        height: bottommostNonBlackPixel || height
    };
};

const init = async () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);

    renderer = new THREE.WebGLRenderer({ canvas: svcanvas.value as HTMLCanvasElement });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    await loadPanorama();

    panoramaContainer?.value?.addEventListener('mousedown', onPointerDown);
    panoramaContainer?.value?.addEventListener('mousemove', onPointerMove);
    panoramaContainer?.value?.addEventListener('mouseup', onPointerUp);
    panoramaContainer?.value?.addEventListener('wheel', onWheel);
    panoramaContainer?.value?.addEventListener('mouseleave', onPointerLeave);

};

const animate = () => {
    requestAnimationFrame(animate);
    update();
};

const update = () => {

    lat = Math.max(-85, Math.min(85, lat));
    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    const x = 500 * Math.sin(phi) * Math.cos(theta);
    const y = 500 * Math.cos(phi);
    const z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(x, y, z);

    renderer.render(scene, camera);
};

const onPointerDown = (event: MouseEvent) => {
    isUserInteracting = true;
    onPointerDownMouseX = event.clientX;
    onPointerDownMouseY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
};

const onPointerMove = (event: MouseEvent) => {
    if (isUserInteracting) {
        const sensitivity = baseSensitivity * Math.tan(camera.fov * Math.PI / 180 / 2);
        lon = (onPointerDownMouseX - event.clientX) * sensitivity + onPointerDownLon;
        lat = (event.clientY - onPointerDownMouseY) * sensitivity + onPointerDownLat;
    }
};

const onPointerUp = () => {
    isUserInteracting = false;
};

const onWheel = (event: WheelEvent) => {
    const fov = camera.fov + event.deltaY * 0.05;
    camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
    camera.updateProjectionMatrix();
};

const onPointerLeave = () => {
    isUserInteracting = false;
};

watch(() => panoId, () => {
    // @ts-expect-error
    if (sphere) {
        scene.remove(sphere);
        loadPanorama();
    }
});

onMounted(async () => {
    await init();
    animate();
});
</script>

<style scoped>
.street-view-panorama {
    height: 75%;
    overflow: hidden;
}

#svcanvas {
    width: 100%;
    height: 100%;
}
</style>
