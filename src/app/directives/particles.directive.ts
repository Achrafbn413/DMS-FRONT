import { Directive, ElementRef, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appParticles]',
  standalone: true
})
export class ParticlesDirective implements OnInit, OnDestroy {
  private particles: HTMLElement[] = [];
  private animationId: number = 0;
  private intervalId: number = 0;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.createParticles();
    this.startAnimation();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private createParticles(): void {
    const container = this.el.nativeElement;
    const particleCount = 25;

    // Nettoyer les particules existantes
    this.cleanup();

    for (let i = 0; i < particleCount; i++) {
      const particle = this.renderer.createElement('div');
      this.renderer.addClass(particle, 'particle');
      
      // Taille aléatoire
      const size = Math.random() * 4 + 2;
      this.renderer.setStyle(particle, 'width', `${size}px`);
      this.renderer.setStyle(particle, 'height', `${size}px`);
      
      // Position aléatoire
      this.renderer.setStyle(particle, 'left', `${Math.random() * 100}%`);
      this.renderer.setStyle(particle, 'top', `${Math.random() * 100}%`);
      
      // Animation aléatoire
      this.renderer.setStyle(particle, 'animation-delay', `${Math.random() * 8}s`);
      this.renderer.setStyle(particle, 'animation-duration', `${Math.random() * 6 + 6}s`);
      
      // Opacité aléatoire
      this.renderer.setStyle(particle, 'opacity', `${Math.random() * 0.6 + 0.2}`);
      
      this.renderer.appendChild(container, particle);
      this.particles.push(particle);
    }
  }

  private startAnimation(): void {
    const animate = () => {
      this.particles.forEach(particle => {
        if (particle && particle.getBoundingClientRect) {
          const rect = particle.getBoundingClientRect();
          if (rect.top > window.innerHeight + 50) {
            this.renderer.setStyle(particle, 'top', '-10px');
            this.renderer.setStyle(particle, 'left', `${Math.random() * 100}%`);
          }
        }
      });
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();

    // Recréer les particules périodiquement
    this.intervalId = window.setInterval(() => {
      if (this.particles.length < 25) {
        this.addNewParticle();
      }
    }, 5000);
  }

  private addNewParticle(): void {
    const container = this.el.nativeElement;
    const particle = this.renderer.createElement('div');
    this.renderer.addClass(particle, 'particle');
    
    const size = Math.random() * 4 + 2;
    this.renderer.setStyle(particle, 'width', `${size}px`);
    this.renderer.setStyle(particle, 'height', `${size}px`);
    this.renderer.setStyle(particle, 'left', `${Math.random() * 100}%`);
    this.renderer.setStyle(particle, 'top', '-10px');
    this.renderer.setStyle(particle, 'animation-delay', '0s');
    this.renderer.setStyle(particle, 'animation-duration', `${Math.random() * 6 + 6}s`);
    this.renderer.setStyle(particle, 'opacity', `${Math.random() * 0.6 + 0.2}`);
    
    this.renderer.appendChild(container, particle);
    this.particles.push(particle);
  }

  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = 0;
    }

    // Supprimer toutes les particules
    this.particles.forEach(particle => {
      if (particle && particle.parentNode) {
        this.renderer.removeChild(particle.parentNode, particle);
      }
    });
    this.particles = [];
  }

  // Méthodes publiques pour contrôler les particules
  public pauseAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  public resumeAnimation(): void {
    if (!this.animationId) {
      this.startAnimation();
    }
  }

  public resetParticles(): void {
    this.cleanup();
    this.createParticles();
    this.startAnimation();
  }
}