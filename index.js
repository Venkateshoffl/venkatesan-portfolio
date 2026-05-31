/* ==========================================================================
   VENKATESAN K - FUTURISTIC PORTFOLIO SCRIPTS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lenis Smooth Scrolling
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
    direction: 'vertical',
    smooth: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Sync Lenis with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // ==========================================================================
  // 1. MOBILE NAVIGATION DRAWER
  // ==========================================================================
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = menuToggle.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.classList.remove('fa-bars-staggered');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars-staggered');
      }
    });

    // Close menu when navigation link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars-staggered');
      });
    });
  }

  // Shrink and blur navbar on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ==========================================================================
  // 3. THREE.JS INTERACTIVE GEMINI-STYLE CONSTELLATION PARTICLES BACKGROUND
  // ==========================================================================
  const canvasContainer = document.getElementById('bg-canvas-container');
  let scene, camera, renderer;
  let pointsMesh, geometryPoints;

  const particleCount = window.innerWidth < 768 ? 800 : 2000;
  const particles = [];

  const mouse2D = new THREE.Vector2(0, 0);
  const mouse3D = new THREE.Vector3(999, 999, 999);
  const raycaster = new THREE.Raycaster();
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // vertical plane at Z=0 for raycast projection
  let isMouseActive = false;

  // Custom circular glowing particle texture canvas creator (soft white core with alpha falloff)
  function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Solid white core
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 1)'); // Keep white core bright
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.6)'); // Smooth edge glow
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }

  function initThree() {
    if (!canvasContainer) return;

    // Scene
    scene = new THREE.Scene();

    // Camera looking down Z axis
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 32;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasContainer.appendChild(renderer.domElement);

    // 1. Build Particles Data (Position, Color, and Drift Physics)
    geometryPoints = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Dynamic Violet/Purple Color Choices
    const colorChoices = [
      new THREE.Color(0.55, 0.36, 0.96),   // Vibrant Violet (#8b5cf6)
      new THREE.Color(0.66, 0.33, 0.97),   // Neon Purple (#a855f7)
      new THREE.Color(0.43, 0.16, 0.85),   // Dark Violet (#6d28d9)
      new THREE.Color(0.75, 0.52, 0.99),   // Light Purple/Violet (#c084fc)
      new THREE.Color(0.92, 0.88, 1.0)     // White-Lavender Glow (almost white with violet tint)
    ];

    for (let i = 0; i < particleCount; i++) {
      // Distribute in a wider 3D space to fully cover the frustum left-to-right, top-to-bottom
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 70;
      const z = (Math.random() - 0.5) * 40 - 10; // push depth back slightly

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Assign a random bright color choice to color attributes
      const randomCol = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = randomCol.r;
      colors[i * 3 + 1] = randomCol.g;
      colors[i * 3 + 2] = randomCol.b;

      particles.push({
        x: x,
        y: y,
        z: z,
        offsetX: 0, // repulsion displacement offsets
        offsetY: 0,
        speedX: (Math.random() - 0.5) * 0.015, // gentle sideways drift
        speedY: -(Math.random() * 0.04 + 0.025), // downward falling speed
        sinOffset: Math.random() * 100, // custom phase shift for organic wiggle
        size: Math.random() * 0.25 + 0.32 // particle size variety
      });
    }

    geometryPoints.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryPoints.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Point Material (uses vertexColors to tint white gradient texture)
    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.46, // Slightly larger size so they appear very sharp, bright, and colorful!
      map: createParticleTexture(),
      transparent: true,
      opacity: 1.0, // Maximum opacity
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    pointsMesh = new THREE.Points(geometryPoints, pointsMaterial);
    scene.add(pointsMesh);

    // Listeners for mouse tracking
    window.addEventListener('mousemove', (e) => {
      isMouseActive = true;
      mouse2D.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse2D.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse2D, camera);
      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(planeZ, intersectPoint)) {
        mouse3D.copy(intersectPoint);
      }
    });

    window.addEventListener('mouseleave', () => {
      isMouseActive = false;
      mouse3D.set(999, 999, 999);
    });

    animateThree();
  }

  function animateThree() {
    requestAnimationFrame(animateThree);

    const time = Date.now() * 0.001;
    const pointPositions = geometryPoints.attributes.position.array;

    // 1. Move and Animate Particles (Snow-like falling with Mouse Ripple Repulsion)
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];

      // Update base snow falling/drift position
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(time + p.sinOffset) * 0.005;

      // Viewport boundaries wrapping
      // Y boundary: when falling below the bottom frustum edge
      if (p.y < -35) {
        p.y = 35;
        p.x = (Math.random() - 0.5) * 100;
        p.speedY = -(Math.random() * 0.04 + 0.025);
        p.speedX = (Math.random() - 0.5) * 0.015;
      }
      // X boundary: when drifting too far left or right
      if (p.x < -50) {
        p.x = 50;
      } else if (p.x > 50) {
        p.x = -50;
      }

      // Calculate actual display position (base falling coordinate + interaction offset)
      const currentActualX = p.x + p.offsetX;
      const currentActualY = p.y + p.offsetY;

      // Mouse repulsion (Water-wave ripple effect)
      const dx = currentActualX - mouse3D.x;
      const dy = currentActualY - mouse3D.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 12 && isMouseActive) {
        // Calculate repulsion force scaling from 0 to 1
        const force = (12 - dist) / 12;
        // Target push vectors
        const targetPushX = (dx / dist) * force * 6.0;
        const targetPushY = (dy / dist) * force * 6.0;

        // Smoothly ease repulsion offset
        p.offsetX += (targetPushX - p.offsetX) * 0.12;
        p.offsetY += (targetPushY - p.offsetY) * 0.12;
      } else {
        // Smoothly ease offset back to 0 when mouse is far or inactive
        p.offsetX += (0 - p.offsetX) * 0.06;
        p.offsetY += (0 - p.offsetY) * 0.06;
      }

      // Slowly float Z (depth parallax vibration)
      const actualZ = p.z + Math.sin(time * 0.5 + i) * 0.5;

      // Write values back to the BufferAttribute array
      pointPositions[i * 3] = p.x + p.offsetX;
      pointPositions[i * 3 + 1] = p.y + p.offsetY;
      pointPositions[i * 3 + 2] = actualZ;
    }
    geometryPoints.attributes.position.needsUpdate = true;

    // Camera reacts to mouse for subtle parallax effect
    if (isMouseActive) {
      const ease = 0.05;
      camera.position.x += (mouse2D.x * 2 - camera.position.x) * ease;
      camera.position.y += (mouse2D.y * 1.5 - camera.position.y) * ease;
      camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
  }

  // Handle Resize
  window.addEventListener('resize', () => {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  initThree();


  // ==========================================================================
  // 4. GSAP SCROLLTRIGGER REVEALS & TIMELINES
  // ==========================================================================
  gsap.registerPlugin(ScrollTrigger);

  // Initial Hero Fade Ups
  gsap.from(".hero .fade-up", {
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.15,
    ease: "power3.out"
  });

  // Reveal elements on scroll (Titles only)
  const sectionsToReveal = document.querySelectorAll(".section");
  sectionsToReveal.forEach(section => {
    const titles = section.querySelectorAll(".section-title, .section-subtitle");

    if (titles.length > 0) {
      gsap.from(titles, {
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  });

  // 3D Scroll Reveal + Smooth Idle Float for all cards/boxes
  const cardsToAnimate = document.querySelectorAll(".glass-card, .training-highlight, .contact-form-card");

  cardsToAnimate.forEach((card, index) => {
    // Generate organic custom floating coordinates and duration
    const floatY = -6 - Math.random() * 4;
    const floatRotX = index % 2 === 0 ? 1.2 : -1.2;
    const floatRotY = index % 2 === 0 ? -1.2 : 1.2;

    const floatTimeline = gsap.timeline({
      repeat: -1,
      yoyo: true,
      paused: true
    });

    // Set base layout perspective so 3D rotation works nicely
    gsap.set(card, { transformPerspective: 1000 });

    floatTimeline.to(card, {
      y: `+=${floatY}`,
      rotationX: `+=${floatRotX}`,
      rotationY: `+=${floatRotY}`,
      duration: 3 + Math.random() * 1.5,
      ease: "sine.inOut"
    });

    // GSAP ScrollTrigger to reveal the card in 3D
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: "top 88%",
        onEnter: () => {
          // Play the floating animation after the entry reveal completes
          gsap.delayedCall(1.0, () => {
            if (!card.matches(':hover')) {
              floatTimeline.play();
            }
          });
        }
      },
      y: 60,
      z: -80,
      rotationX: 12,
      rotationY: -8,
      opacity: 0,
      duration: 0.95,
      ease: "power2.out"
    });

    // Hover controls to flatten and straighten the card
    card.addEventListener('mouseenter', () => {
      floatTimeline.pause();
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        y: -4, // Lift slightly, flat straight angle
        z: 0,
        scale: 1.03,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto"
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => {
          floatTimeline.play();
        }
      });
    });
  });

  // Timeline Scroll Line Fill Animation
  const timelineProgress = document.getElementById('timeline-scroll-progress');
  const journeySection = document.getElementById('journey');

  if (timelineProgress && journeySection) {
    gsap.to(timelineProgress, {
      scrollTrigger: {
        trigger: journeySection,
        start: "top 50%",
        end: "bottom 60%",
        scrub: true
      },
      height: "100%",
      ease: "none"
    });

    // Make timeline item dots light up as they cross center screen
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
      ScrollTrigger.create({
        trigger: item,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => item.classList.add('active'),
        onLeaveBack: () => item.classList.remove('active'),
        onEnterBack: () => item.classList.add('active')
      });
    });
  }

  // ==========================================================================
  // 5. CARD SPOTLIGHT HOVER EFFECTS & PERSPECTIVE TILT
  // ==========================================================================
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });



  // ==========================================================================
  // 6. MAGNETIC BUTTONS FX
  // ==========================================================================
  const magnetBtns = document.querySelectorAll('.magnet-btn, .social-circle, .back-to-top');
  magnetBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Move button by 40% of mouse distance
      gsap.to(btn, {
        x: x * 0.45,
        y: y * 0.45,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.4)"
      });
    });
  });

  // ==========================================================================
  // 7. HERO TYPING EFFECT
  // ==========================================================================
  const typingElement = document.getElementById('typing-element');
  const words = ['Java Full Stack Developer', 'Frontend Developer', 'UI Designer', 'Tech Enthusiast'];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100;

  function type() {
    if (!typingElement) return;

    const currentWord = words[wordIndex];
    if (isDeleting) {
      typingElement.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 50; // Deleting is faster
    } else {
      typingElement.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 100;
    }

    if (!isDeleting && charIndex === currentWord.length) {
      isDeleting = true;
      typingSpeed = 2000; // Pause at full word
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typingSpeed = 500; // Pause before typing next word
    }

    setTimeout(type, typingSpeed);
  }
  type();

  // ==========================================================================
  // 8. SKILL CARDS CATEGORY FILTERS
  // ==========================================================================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const skillCards = document.querySelectorAll('.skill-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle Active Tab Style
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      // Stagger hide & show cards with GSAP
      gsap.to(skillCards, {
        scale: 0.8,
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
          skillCards.forEach(card => {
            if (filter === 'all' || card.dataset.category === filter) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          });
          
          const activeCards = Array.from(skillCards).filter(c => filter === 'all' || c.dataset.category === filter);
          gsap.to(activeCards, {
            scale: 1,
            opacity: 1,
            duration: 0.35,
            stagger: 0.05,
            ease: "power2.out"
          });
        }
      });
    });
  });

  // ==========================================================================
  // 9. SKILLS PROGRESS FILL ON SCROLL
  // ==========================================================================
  const progressFills = document.querySelectorAll('.skill-progress-fill');
  progressFills.forEach(fill => {
    const targetVal = fill.dataset.progress;
    ScrollTrigger.create({
      trigger: fill,
      start: "top 90%",
      onEnter: () => {
        fill.style.width = targetVal;
      }
    });
  });

  // ==========================================================================
  // 10. STATISTICS NUMERICAL TICKING COUNTERS
  // ==========================================================================
  const statsElements = document.querySelectorAll('.stat-number');
  statsElements.forEach(stat => {
    const target = parseInt(stat.dataset.target, 10);
    const suffix = stat.querySelector('span').innerText;
    
    ScrollTrigger.create({
      trigger: stat,
      start: "top 85%",
      onEnter: () => {
        let current = 0;
        const duration = 1500; // ms
        const stepTime = Math.max(Math.floor(duration / target), 15);
        const timer = setInterval(() => {
          current += Math.ceil(target / 40); // increment steps
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          stat.innerHTML = `${current}<span>${suffix}</span>`;
        }, stepTime);
      }
    });
  });

  // ==========================================================================
  // 11. INTERACTIVE DEMO MODALS
  // ==========================================================================
  const projectModal = document.getElementById('project-modal');
  const modalContent = document.getElementById('modal-content');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const demoButtons = document.querySelectorAll('.demo-trigger-btn');

  const demoTemplates = {
    strikingly: `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <h3 style="font-size:1.8rem; color:#FFFFFF;">Strikingly Landing Page Mockup</h3>
        <p style="color:var(--color-text-secondary);">This interactive mockup demonstrates the visual layout builder components coded for the Strikingly Clone.</p>
        
        <!-- Live Layout Simulator -->
        <div style="border:1px solid rgba(139, 92, 246, 0.2); border-radius:12px; padding:20px; background:rgba(3, 0, 20, 0.6); display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:12px;">
            <span style="font-weight:600; color:var(--color-violet-light);"><i class="fa-solid fa-square-poll-vertical"></i> Live Layout Editor</span>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary layout-action-btn active" data-style="sleek" style="padding: 6px 12px; font-size:0.75rem;">Sleek Dark</button>
              <button class="btn btn-secondary layout-action-btn" data-style="neon" style="padding: 6px 12px; font-size:0.75rem;">Neon Glow</button>
              <button class="btn btn-secondary layout-action-btn" data-style="minimal" style="padding: 6px 12px; font-size:0.75rem;">Minimalist</button>
            </div>
          </div>
          
          <div id="simulated-preview-box" style="border-radius:8px; padding:30px; background:rgba(255,255,255,0.02); min-height:180px; display:flex; flex-direction:column; gap:12px; transition: var(--transition-smooth);">
            <div style="font-family:'Space Grotesk', sans-serif; font-size:1.4rem; font-weight:700; color:#ffffff;" id="simulated-title">Design Your Business Landing Page</div>
            <div style="font-size:0.85rem; color:var(--color-text-secondary);" id="simulated-desc">Pick layouts, drag blocks, and launch in minutes. Responsive grids built with modern HTML5.</div>
            <div style="display:flex; gap:12px; margin-top:8px;">
              <button class="btn btn-primary" style="padding:8px 16px; font-size:0.8rem;" id="simulated-btn">Get Started</button>
              <button class="btn btn-secondary" style="padding:8px 16px; font-size:0.8rem;">Learn More</button>
            </div>
          </div>
        </div>
        
        <p style="font-size:0.85rem; color:var(--color-text-muted);"><i class="fa-solid fa-circle-info"></i> Press variables or actions to see layout state recalculations instantly.</p>
      </div>
    `,
    library: `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <h3 style="font-size:1.8rem; color:#FFFFFF;">Library Records Catalog System</h3>
        <p style="color:var(--color-text-secondary);">Interactive frontend prototype of the Python Flask + SQL database record dashboard query system.</p>
        
        <!-- Live Database Query Simulator -->
        <div style="border:1px solid rgba(139, 92, 246, 0.2); border-radius:12px; padding:20px; background:rgba(3, 0, 20, 0.6); display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="position:relative; flex-grow:1;">
              <input type="text" id="library-search-input" class="form-control" placeholder="Search books by title, author, or genre..." style="padding:10px 40px 10px 15px; font-size:0.85rem;">
              <i class="fa-solid fa-magnifying-glass" style="position:absolute; right:15px; top:50%; transform:translateY(-50%); color:var(--color-text-muted);"></i>
            </div>
          </div>
          
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.85rem;">
            <thead>
              <tr style="border-bottom:1px solid rgba(139, 92, 246, 0.25); color:var(--color-violet-light);">
                <th style="padding:8px;">ID</th>
                <th style="padding:8px;">Book Title</th>
                <th style="padding:8px;">Author</th>
                <th style="padding:8px;">Genre</th>
                <th style="padding:8px; text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody id="library-table-body">
              <!-- Populated via script -->
            </tbody>
          </table>
        </div>
        
        <p style="font-size:0.85rem; color:var(--color-text-muted);"><i class="fa-solid fa-circle-info"></i> Typings query directly filters simulated memory variables dynamically.</p>
      </div>
    `
  };

  const dummyBooks = [
    { id: "B101", title: "Introduction to Java Programming", author: "Y. Daniel Liang", genre: "Programming", status: "Available" },
    { id: "B102", title: "Design Patterns", author: "Erich Gamma", genre: "Software Design", status: "Checked Out" },
    { id: "B103", title: "Clean Code", author: "Robert C. Martin", genre: "Programming", status: "Available" },
    { id: "B104", title: "Learning Python", author: "Mark Lutz", genre: "Programming", status: "Available" },
    { id: "B105", title: "SQL Queries for Mere Mortals", author: "John Viescas", genre: "Databases", status: "Available" }
  ];

  function bindDemoInteractions(projectKey) {
    if (projectKey === 'strikingly') {
      const actions = document.querySelectorAll('.layout-action-btn');
      const box = document.getElementById('simulated-preview-box');
      const title = document.getElementById('simulated-title');
      const desc = document.getElementById('simulated-desc');
      const btn = document.getElementById('simulated-btn');

      actions.forEach(act => {
        act.addEventListener('click', () => {
          actions.forEach(a => a.classList.remove('active'));
          act.classList.add('active');

          const style = act.dataset.style;
          if (style === 'sleek') {
            box.style.background = 'rgba(255,255,255,0.02)';
            box.style.border = 'none';
            box.style.boxShadow = 'none';
            title.style.color = '#ffffff';
            title.style.fontFamily = "'Space Grotesk', sans-serif";
            desc.style.color = 'var(--color-text-secondary)';
            btn.style.background = 'linear-gradient(135deg, var(--color-violet-main) 0%, var(--color-violet-dark) 100%)';
          } else if (style === 'neon') {
            box.style.background = 'rgba(139, 92, 246, 0.05)';
            box.style.border = '1px solid var(--color-violet-light)';
            box.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.3)';
            title.style.color = 'var(--color-violet-light)';
            title.style.textShadow = '0 0 10px rgba(168, 85, 247, 0.4)';
            desc.style.color = '#ffffff';
            btn.style.background = '#A855F7';
          } else if (style === 'minimal') {
            box.style.background = '#ffffff';
            box.style.border = 'none';
            box.style.boxShadow = 'none';
            title.style.color = '#030014';
            title.style.fontFamily = 'sans-serif';
            desc.style.color = '#4b5563';
            btn.style.background = '#030014';
          }
        });
      });
    }

    if (projectKey === 'library') {
      const searchInput = document.getElementById('library-search-input');
      const tableBody = document.getElementById('library-table-body');

      function populateTable(filterStr = "") {
        if (!tableBody) return;
        tableBody.innerHTML = "";
        
        const q = filterStr.toLowerCase();
        const filtered = dummyBooks.filter(b => 
          b.title.toLowerCase().includes(q) || 
          b.author.toLowerCase().includes(q) || 
          b.genre.toLowerCase().includes(q) || 
          b.id.toLowerCase().includes(q)
        );

        if (filtered.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align:center; padding:20px; color:var(--color-text-muted);">No records found.</td>
            </tr>
          `;
          return;
        }

        filtered.forEach(b => {
          const statusStyle = b.status === 'Available' ? 'color:#10B981; font-weight:600;' : 'color:#EF4444; font-weight:600;';
          tableBody.innerHTML += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.03); hover:background:rgba(255,255,255,0.01);">
              <td style="padding:10px 8px; color:var(--color-text-muted);">${b.id}</td>
              <td style="padding:10px 8px; font-weight:500; color:#FFFFFF;">${b.title}</td>
              <td style="padding:10px 8px; color:var(--color-text-secondary);">${b.author}</td>
              <td style="padding:10px 8px; color:var(--color-text-secondary);">${b.genre}</td>
              <td style="padding:10px 8px; text-align:center; ${statusStyle}">${b.status}</td>
            </tr>
          `;
        });
      }

      populateTable();

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          populateTable(e.target.value);
        });
      }
    }
  }

  function openModal(projectKey) {
    if (!projectModal || !modalContent) return;
    modalContent.innerHTML = demoTemplates[projectKey] || '';
    
    // Bind click functions
    bindDemoInteractions(projectKey);

    projectModal.style.pointerEvents = 'auto';
    gsap.to(projectModal, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    });
  }

  function closeModal() {
    if (!projectModal) return;
    projectModal.style.pointerEvents = 'none';
    gsap.to(projectModal, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        if (modalContent) modalContent.innerHTML = '';
      }
    });
  }

  demoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.project;
      openModal(key);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  // Close modal when clicking outside contents box
  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) {
        closeModal();
      }
    });
  }

  // ==========================================================================
  // 12. CONTACT FORM VAL & CONFETTI CELEBRATION
  // ==========================================================================
  const contactForm = document.getElementById('contact-form');
  const successToast = document.getElementById('success-toast');
  const errorToast = document.getElementById('error-toast');
  const submitBtn = document.getElementById('form-submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Retrieve form values
      const nameVal = document.getElementById('form-name').value.trim();
      const emailVal = document.getElementById('form-email').value.trim();
      const subjectVal = document.getElementById('form-subject').value.trim();
      const messageVal = document.getElementById('form-message').value.trim();

      // Client-side Validation checks
      if (!nameVal || !emailVal || !subjectVal || !messageVal) {
        showToast(errorToast, "All fields are required. Please check your entries.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        showToast(errorToast, "Please enter a valid email address.");
        return;
      }

      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin" style="font-size: 0.85rem;"></i>';
      }

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            access_key: 'ACCESS_KEY_HERE',
            name: nameVal,
            email: emailVal,
            subject: subjectVal,
            message: messageVal
          })
        });

        const result = await response.json();

        if (result.success) {
          // Trigger Confetti Celebration (Loaded via CDN)
          if (typeof confetti === 'function') {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#8B5CF6', '#A855F7', '#6D28D9', '#FFFFFF', '#030014']
            });
          }

          // Show success toast
          showToast(successToast);

          // Reset form fields
          contactForm.reset();
        } else {
          // Show error toast
          showToast(errorToast, result.message || "Failed to send message. Please try again.");
        }
      } catch (err) {
        console.error("Web3Forms Submission Error:", err);
        showToast(errorToast, "A network error occurred. Please try again later.");
      } finally {
        // Restore button loading state
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane" style="font-size: 0.85rem;"></i>';
        }
      }
    });
  }

  // Helper function to handle toast display
  let activeToastTimers = {};
  function showToast(toastEl, customMessage = null) {
    if (!toastEl) return;

    // Set custom message text if provided
    if (customMessage) {
      const msgDesc = toastEl.querySelector('p');
      if (msgDesc) msgDesc.textContent = customMessage;
    }

    // Clear any existing active timer for this toast
    if (activeToastTimers[toastEl.id]) {
      clearTimeout(activeToastTimers[toastEl.id]);
      toastEl.classList.remove('show');
      // Small delay to reset transform transition
      setTimeout(() => toastEl.classList.add('show'), 50);
    } else {
      toastEl.classList.add('show');
    }

    // Set 4-second visibility timer
    activeToastTimers[toastEl.id] = setTimeout(() => {
      toastEl.classList.remove('show');
      delete activeToastTimers[toastEl.id];
    }, 4000);
  }

  // ==========================================================================
  // 13. BACK TO TOP BUTTON
  // ==========================================================================
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.pointerEvents = 'auto';
      } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.pointerEvents = 'none';
      }
    });

    backToTopBtn.addEventListener('click', () => {
      lenis.scrollTo(0);
    });
  }

});
