"use client";

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { useEffect, useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';

type GL = Renderer['gl'];

interface BookData {
  id: string;
  image_couverture?: string;
  titre: string;
  auteur: string;
  note_generale?: number;
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: number;
  return function (this: any, ...args: Parameters<T>) {
    if (typeof window !== 'undefined') {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => func.apply(this, args), wait);
    }
  };
}

interface MediaProps {
  geometry: Plane;
  gl: GL;
  book: BookData;
  index: number;
  length: number;
  scene: Transform;
  viewport: { width: number; height: number };
  onBookClick?: (book: BookData) => void;
}

class Media {
  extra: number = 0;
  geometry: Plane;
  gl: GL;
  book: BookData;
  index: number;
  length: number;
  scene: Transform;
  viewport: { width: number; height: number };
  onBookClick?: (book: BookData) => void;
  program!: Program;
  plane!: Mesh;
  width!: number;
  widthTotal!: number;
  x!: number;
  isBefore: boolean = false;
  isAfter: boolean = false;

  constructor({
    geometry,
    gl,
    book,
    index,
    length,
    scene,
    viewport,
    onBookClick
  }: MediaProps) {
    this.geometry = geometry;
    this.gl = gl;
    this.book = book;
    this.index = index;
    this.length = length;
    this.scene = scene;
    this.viewport = viewport;
    this.onBookClick = onBookClick;
    this.createShader();
    this.createMesh();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl);
    
    this.program = new Program(this.gl, {
      vertex: '
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uHover;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          
          // Animation plus fluide et réactive
          float wave = sin(uTime * 0.4 + p.x * 0.3) * 0.003;
          float hoverEffect = uHover * 0.015 + wave;
          p.z = hoverEffect;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      ',
      fragment: '
        precision highp float;
        uniform sampler2D tMap;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform float uHover;
        varying vec2 vUv;
        
        void main() {
          // Cover fit simple et stable
          vec2 scale = vec2(1.0);
          vec2 aspectRatio = uImageSizes / uPlaneSizes;
          
          if (aspectRatio.x > aspectRatio.y) {
            scale.x = aspectRatio.y / aspectRatio.x;
          } else {
            scale.y = aspectRatio.x / aspectRatio.y;
          }
          
          vec2 uv = (vUv - 0.5) / scale + 0.5;
          vec4 color = texture2D(tMap, uv);
          
          // Bordures arrondies améliorées
          vec2 center = abs(vUv - 0.5);
          float border = max(center.x, center.y);
          float radius = 0.02; // Coins légèrement arrondis
          float alpha = 1.0 - smoothstep(0.45 - radius, 0.48, border);
          
          // Effet hover léger et amélioration des couleurs
          vec3 finalColor = mix(color.rgb, color.rgb * 1.15 + vec3(0.02), uHover * 0.3);
          
          // Améliorer le contraste
          finalColor = pow(finalColor, vec3(0.95));
          
          gl_FragColor = vec4(finalColor, alpha * color.a);
        }
      ',
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [1, 1] },
        uImageSizes: { value: [1, 1] },
        uTime: { value: 0 },
        uHover: { value: 0 }
      },
      transparent: true
    });

    // Chargement d'image sécurisé
    this.loadTexture(texture);
  }

  async loadTexture(texture: Texture) {
    try {
      if (this.book.image_couverture) {
        console.log("Loading image: ", this.book.image_couverture);
        
        const img = new Image();
        
        // Configuration CORS améliorée
        try {
          const url = new URL(this.book.image_couverture, window.location.origin);
          const isSameDomain = url.origin === window.location.origin;
          
          if (!isSameDomain) {
            // Essayer d'abord sans crossOrigin
            img.crossOrigin = '';
          }
        } catch {
          // URL relative ou malformée, traiter comme locale
        }
        
        await new Promise<void>((resolve) => {
          let resolved = false;
          
          img.onload = () => {
            if (resolved) return;
            resolved = true;
            
            try {
              console.log("Image loaded successfully:", this.book.titre);
              texture.image = img;
              this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
              resolve();
            } catch (error) {
              console.warn("Failed to set texture:", error);
              this.createPlaceholder(texture);
              resolve();
            }
          };
          
          img.onerror = (error) => {
            if (resolved) return;
            resolved = true;
            
            console.warn("Image load failed for: ", this.book.titre, error);
            
            // Essayer une seconde fois avec crossOrigin différent
            if (img.crossOrigin === "") {
              const retryImg = new Image();
              retryImg.crossOrigin = 'anonymous';
              
              retryImg.onload = () => {
                try {
                  texture.image = retryImg;
                  this.program.uniforms.uImageSizes.value = [retryImg.naturalWidth, retryImg.naturalHeight];
                  console.log("Image loaded on retry:", this.book.titre);
                } catch {
                  this.createPlaceholder(texture);
                }
                resolve();
              };
              
              retryImg.onerror = () => {
                console.warn("Retry also failed for:", this.book.titre);
                this.createPlaceholder(texture);
                resolve();
              };
              
              retryImg.src = this.book.image_couverture!;
            } else {
              this.createPlaceholder(texture);
              resolve();
            }
          };
          
          img.src = this.book.image_couverture!;
          
          // Timeout de sécurité
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              console.warn("Image load timeout for:", this.book.titre);
              this.createPlaceholder(texture);
              resolve();
            }
          }, 3000);
        });
      } else {
        console.log("No image URL, creating placeholder for:", this.book.titre);
        this.createPlaceholder(texture);
      }
    } catch (error) {
      console.warn("Texture loading error: ", error);
      this.createPlaceholder(texture);
    }
  }

  createPlaceholder(texture: Texture) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Gradient de fond plus attractif
      const gradient = ctx.createLinearGradient(0, 0, 400, 600);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(0.5, '#764ba2');
      gradient.addColorStop(1, '#f093fb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 600);
      
      // Cadre décoratif
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 360, 560);

      // Titre centré avec gestion des retours à la ligne
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px Arial, sans-serif';
      
      const title = this.book.titre.length > 30 ? this.book.titre.substring(0, 27) + '...' : this.book.titre;
      const words = title.split(' ');
      let line = '';
      const lines = [];
      const maxWidth = 320;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      const startY = 250 - (lines.length * 25) / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line.trim(), 200, startY + (i * 30));
      });
      
      // Auteur
      ctx.font = '16px Arial, sans-serif';
      const author = this.book.auteur.length > 35 ? this.book.auteur.substring(0, 32) + '...' : this.book.auteur;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(author, 200, startY + (lines.length * 30) + 20);

      // Note avec étoiles
      if (this.book.note_generale) {
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillStyle = '#ffd700';
        const stars = '★'.repeat(Math.floor(this.book.note_generale / 2)) + 
                     (this.book.note_generale % 2 >= 1 ? '☆' : `);
        ctx.fillText(`${stars}`${this.book.note_generale}/10`, 200, startY + (lines.length * 30) + 60);
      }
      
      // Icône livre
      ctx.font = `40px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('📖', 200, 120);

      console.log('Created placeholder for:', this.book.titre);
      texture.image = canvas;
      this.program.uniforms.uImageSizes.value = [400, 600];
    } catch (error) {
      console.warn("Placeholder creation error: ", error);
      // Fallback très simple
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(0, 0, 300, 450);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        ctx.fillText('Livre non disponible', 150, 225);
        texture.image = canvas;
      }
    }
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }

  update(scroll: { current: number; last: number }, direction: 'right' | 'left') {
    this.plane.position.x = this.x - scroll.current - this.extra;
    this.plane.position.y = 0;
    this.plane.rotation.z = 0;

    // Animation timer plus fluide
    this.program.uniforms.uTime.value += 0.008;

    // Effet hover amélioré basé sur la proximité du centre
    const distanceFromCenter = Math.abs(this.plane.position.x) / (this.viewport.width / 2);
    const hoverAmount = Math.max(0, 1 - Math.pow(distanceFromCenter, 1.5));
    this.program.uniforms.uHover.value = hoverAmount * 0.4;

    // Gestion de la boucle infinie
    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize() {
    // Taille des livres proportionnelle
    const baseHeight = this.viewport.height * 0.7;
    this.plane.scale.y = baseHeight;
    this.plane.scale.x = baseHeight * 0.67; // Ratio livre

    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    
    // Espacement
    const padding = this.plane.scale.x * 0.3;
    this.width = this.plane.scale.x + padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class GalleryApp {
  container: HTMLElement;
  scroll: {
    ease: number;
    current: number;
    target: number;
    last: number;
    position?: number;
  };
  onCheckDebounce: (...args: any[]) => void;
  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Plane;
  medias: Media[] = [];
  books: BookData[] = [];
  screen!: { width: number; height: number };
  viewport!: { width: number; height: number };
  raf: number = 0;
  isDown: boolean = false;
  start: number = 0;
  hasMoved: boolean = false;
  onBookClick?: (book: BookData) => void;

  constructor(container: HTMLElement, books: BookData[], onBookClick?: (book: BookData) => void) {
    this.container = container;
    this.onBookClick = onBookClick;
    this.scroll = { ease: 0.15, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 50);
    
    this.init(books);
  }

  async init(books: BookData[]) {
    try {
      this.createRenderer();
      this.createCamera();
      this.createScene();
      this.onResize();
      this.createGeometry();
      this.createMedias(books);
      this.addEventListeners();
      this.update();
    } catch (error) {
      console.error("Gallery initialization error: ", error);
    }
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    
    // Optimisations WebGL
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    
    const canvas = this.renderer.gl.canvas as HTMLCanvasElement;
    canvas.style.willChange = 'transform';
    this.container.appendChild(canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 2,
      widthSegments: 2
    });
  }

  createMedias(books: BookData[]) {
    if (!books || !books.length) return;

    // Dupliquer pour boucle infinie
    this.books = [...books, ...books];
    this.medias = this.books.map((book, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        book,
        index,
        length: this.books.length,
        scene: this.scene,
        viewport: this.viewport,
        onBookClick: this.onBookClick
      });
    });
  }

  onTouchDown = (e: MouseEvent | TouchEvent) => {
    this.isDown = true;
    this.hasMoved = false;
    this.scroll.position = this.scroll.current;
    this.start = 'touches' in e ? e.touches[0].clientX : e.clientX;
  };

  onTouchMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isDown) return;
    this.hasMoved = true;
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * 0.025;
    this.scroll.target = (this.scroll.position ?? 0) + distance;
  };

  onTouchUp = () => {
    this.isDown = false;
    this.onCheck();
  };

  onClick = () => {
    if (this.hasMoved) return;
    
    let closestMedia: Media | null = null;
    let minDistance = Infinity;

    for (const media of this.medias) {
      const distance = Math.abs(media.plane.position.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestMedia = media;
      }
    }

    if (closestMedia && this.onBookClick) {
      this.onBookClick(closestMedia.book);
    }
  };

  onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    const scrollSpeed = Math.abs(delta) > 100 ? 0.8 : 0.4;
    this.scroll.target += (delta > 0 ? 1 : -1) * scrollSpeed;
    this.onCheckDebounce();
  };

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize = () => {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    
    if (this.medias) {
      this.medias.forEach(media => media.onResize());
    }
  };

  update = () => {
    try {
      const deltaScroll = Math.abs(this.scroll.current - this.scroll.target);
      const dynamicEase = deltaScroll > 2 ? this.scroll.ease * 1.5 : this.scroll.ease;
      
      this.scroll.current = lerp(this.scroll.current, this.scroll.target, dynamicEase);
      const direction = this.scroll.current > this.scroll.last ? "right" : "left";
      
      if (this.medias) {
        // Optimisation: ne mettre à jour que les éléments visibles
        const viewportBounds = this.viewport.width * 1.2; // Marge pour le pré-chargement
        this.medias.forEach(media => {
          const isVisible = Math.abs(media.plane.position.x) < viewportBounds;
          if (isVisible) {
            media.update(this.scroll, direction);
          }
        });
      }
      
      // Rendu seulement si nécessaire
      const shouldRender = deltaScroll > 0.001 || Math.abs(this.scroll.current - this.scroll.last) > 0.001;
      if (shouldRender) {
        this.renderer.render({ scene: this.scene, camera: this.camera });
      }
      
      this.scroll.last = this.scroll.current;
      this.raf = requestAnimationFrame(this.update);
    } catch (error) {
      console.warn("Render error: ", error);
      this.raf = requestAnimationFrame(this.update);
    }
  };

  addEventListeners() {
    window.addEventListener("resize", this.onResize);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    this.container.addEventListener('mousedown', this.onTouchDown, { passive: true });
    this.container.addEventListener('mousemove', this.onTouchMove, { passive: true });
    this.container.addEventListener('mouseup', this.onTouchUp, { passive: true });
    this.container.addEventListener('click', this.onClick, { passive: true });
    this.container.addEventListener('touchstart', this.onTouchDown, { passive: true });
    this.container.addEventListener('touchmove', this.onTouchMove, { passive: false }); // Non-passive pour le preventDefault
    this.container.addEventListener('touchend', this.onTouchUp, { passive: true });
  }

  destroy() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    
    window.removeEventListener('resize', this.onResize);
    this.container.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('mousedown', this.onTouchDown);
    this.container.removeEventListener('mousemove', this.onTouchMove);
    this.container.removeEventListener('mouseup', this.onTouchUp);
    this.container.removeEventListener('click', this.onClick);
    this.container.removeEventListener('touchstart', this.onTouchDown);
    this.container.removeEventListener('touchmove', this.onTouchMove);
    this.container.removeEventListener('touchend', this.onTouchUp);
    
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas as HTMLCanvasElement);
    }
  }
}

interface CircularGalleryProps {
  books?: BookData[];
  onBookClick?: (book: BookData) => void;
  className?: string;
}

export default function CircularGallery({
  books,
  onBookClick,
  className = `
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<GalleryApp | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current || !books?.length) return;
    
    // Nettoyer l`ancienne instance
    if (appRef.current) {
      appRef.current.destroy();
      appRef.current = null;
    }

    // Créer la nouvelle instance
    try {
      appRef.current = new GalleryApp(containerRef.current, books, onBookClick);
    } catch (error) {
      console.error(`Gallery creation error:`, error);
    }

    return () => {
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [isClient, books, onBookClick]);

  if (!isClient) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="animate-pulse">
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="w-32 h-48 bg-gradient-to-br from-purple-200/50 to-pink-200/50 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-purple-500" />
          </div>
          <p className="text-lg text-gray-600">Aucun livre disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full h-full cursor-grab active:cursor-grabbing ${className}`} 
      ref={containerRef}
      style={{ touchAction: `none` }}
    />
  );
}

export type { BookData };