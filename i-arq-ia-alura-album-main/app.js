// ===================================================
// CONFIGURAÇÃO DA API
// Quando o frontend for servido pelo FastAPI (Dia 3), a API está
// no mesmo servidor — usamos uma URL relativa ou o endereço completo.
// ===================================================
const API_BASE_URL = "http://localhost:8000";

// Carrega a preferência de tema no início para evitar piscadas (FOUC)
const savedTheme = localStorage.getItem("album-theme") || "dark";
if (savedTheme === "light") {
    document.body.classList.add("light-mode");
}

// ===================================================
// FUNÇÃO: Preenche os slots do álbum com imagens da API
// Esta função é chamada após o álbum ser inicializado.
// ===================================================
async function preencherFigurinhas() {
    try {
        // 1. Busca as figurinhas disponíveis na API
        const response = await fetch(`${API_BASE_URL}/figurinhas`);

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }

        // 2. Converte o JSON em array JavaScript
        const figurinhas = await response.json();

        // 3. Cria um Map de id → figurinha para lookup rápido
        const porId = new Map(figurinhas.map(f => [f.id, f]));

        // 4. Percorre todos os slots do HTML
        const slots = document.querySelectorAll(".sticker-slot");

        for (const slot of slots) {
            const slotNumeroEl = slot.querySelector(".slot-number");
            if (!slotNumeroEl) continue;

            // Extrai o número do slot: "#01" → 1
            const id = parseInt(slotNumeroEl.textContent.replace("#", ""), 10);

            // Se já existir imagem local para este slot, pula o carregamento da API
            const slotStrId = slotNumeroEl.textContent.trim();
            if (localStorage.getItem(`sticker-${slotStrId}`)) continue;

            if (!porId.has(id)) continue;

            // A figurinha existe: insere a imagem
            const figurinha = porId.get(id);

            const img = document.createElement("img");
            img.src = `${API_BASE_URL}${figurinha.imagem_url}`;
            img.alt = figurinha.nome;
            img.className = "sticker-img";

            img.onload = () => slot.classList.add("slot-preenchido");
            img.onerror = () => console.warn(`Imagem não encontrada: ${figurinha.nome}`);

            slot.insertBefore(img, slot.firstChild);
        }

        console.log(`✅ ${figurinhas.length} figurinhas carregadas da API!`);

    } catch (erro) {
        // Ignora silenciosamente ou avisa no console sem travar o app
        console.info("ℹ️ Não conectado à API backend, operando no modo Offline (Local Storage).");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const bookElement = document.getElementById("book");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const soundToggle = document.getElementById("sound-toggle");
    const iconOn = soundToggle.querySelector(".sound-icon-on");
    const iconOff = soundToggle.querySelector(".sound-icon-off");

    let isMuted = false;
    let pageFlip = null;

    // 1. Initialize St.PageFlip
    try {
        pageFlip = new St.PageFlip(bookElement, {
            width: 550, // Base page width
            height: 800, // Base page height
            size: "stretch",
            minWidth: 315,
            maxWidth: 1000,
            minHeight: 420,
            maxHeight: 1350,
            drawShadow: true,
            maxShadowOpacity: 0.4, // Aumenta levemente contraste da sombra
            showCover: true,
            mobileScrollSupport: true,
            useMouseEvents: false, // Desativa gestos padrão do StPageFlip para evitar cliques indesejados nas bordas/páginas
            showPageCorners: false, // Remove dobras dos cantos no hover
            disableFlipByClick: true, // Garante que a virada por cliques simples esteja desativada
            flippingTime: 800 // Transição mais ágil e snappier (800ms em vez de 1000ms)
        });

        // Load pages from HTML
        pageFlip.loadFromHTML(document.querySelectorAll(".page"));

        // Estado de arraste personalizado
        let activeDragPage = null;
        let isClicking = false;
        let startX = 0;
        let startY = 0;
        let dragStarted = false;

        // Monitora o mousedown/touchstart em cada página para iniciar a intenção de arraste
        document.querySelectorAll(".page").forEach((page, index) => {
            page.addEventListener("mousedown", (e) => {
                if (e.target.closest("button") || e.target.closest("a")) return;
                isClicking = true;
                startX = e.clientX;
                startY = e.clientY;
                dragStarted = false;
                activeDragPage = { page, index };
            });

            page.addEventListener("touchstart", (e) => {
                if (e.target.closest("button") || e.target.closest("a")) return;
                const touch = e.touches[0];
                isClicking = true;
                startX = touch.clientX;
                startY = touch.clientY;
                dragStarted = false;
                activeDragPage = { page, index };
            });
        });

        // Executa o movimento de dobra apenas se o mouse/dedo se mover além de um limiar (threshold)
        const handleMove = (clientX, clientY, isTouch = false) => {
            if (!isClicking || !activeDragPage) return;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            const bookRect = bookElement.getBoundingClientRect();

            // Só ativa o flip se mover mais de 10px (evita disparar ao clicar e soltar estático)
            if (distance > 10 && !dragStarted) {
                dragStarted = true;
                let cornerX, cornerY;
                
                // Determina canto vertical (topo vs base) em coordenadas relativas ao livro
                const centerY = bookRect.top + bookRect.height / 2;
                if (startY < centerY) {
                    cornerY = 0; // Canto superior
                } else {
                    cornerY = bookRect.height; // Canto inferior
                }

                // Determina canto horizontal (direita vs esquerda) em coordenadas relativas ao livro
                if (activeDragPage.index % 2 === 0) {
                    cornerX = bookRect.width; // Canto direito
                } else {
                    cornerX = 0; // Canto esquerdo
                }
                
                document.body.classList.add("dragging");
                pageFlip.startUserTouch({ x: cornerX, y: cornerY });
            }
            
            if (dragStarted) {
                const relX = clientX - bookRect.left;
                const relY = clientY - bookRect.top;
                pageFlip.userMove({ x: relX, y: relY }, isTouch);
            }
        };

        const handleRelease = (clientX, clientY, isTouch = false) => {
            if (dragStarted) {
                const bookRect = bookElement.getBoundingClientRect();
                const relX = clientX - bookRect.left;
                const relY = clientY - bookRect.top;
                pageFlip.userStop({ x: relX, y: relY }, isTouch);
            }
            isClicking = false;
            dragStarted = false;
            activeDragPage = null;
            document.body.classList.remove("dragging");
        };

        window.addEventListener("mousemove", (e) => {
            handleMove(e.clientX, e.clientY, false);
        });

        window.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY, true);
            }
        });

        window.addEventListener("mouseup", (e) => {
            handleRelease(e.clientX, e.clientY, false);
        });

        window.addEventListener("touchend", (e) => {
            const touch = e.changedTouches[0] || e.touches[0];
            if (touch) {
                handleRelease(touch.clientX, touch.clientY, true);
            } else {
                handleRelease(startX, startY, true);
            }
        });

        // Show book after successful initialization
        bookElement.style.display = "block";

        // Dia 3: Busca as figurinhas da API e preenche o álbum
        // A função é async, chamamos sem await para não bloquear a inicialização do álbum
        preencherFigurinhas();

        // Option B: Carrega do localStorage no início
        const slots = document.querySelectorAll(".sticker-slot");
        slots.forEach(slot => {
            const slotNumeroEl = slot.querySelector(".slot-number");
            if (!slotNumeroEl) return;
            const slotId = slotNumeroEl.textContent.trim(); // e.g. "#01"
            const savedImg = localStorage.getItem(`sticker-${slotId}`);
            if (savedImg) {
                renderSticker(slot, savedImg, slotId);
            }
        });

        // Adiciona evento de clique usando delegação de eventos para suportar clones e passar pelo canvas
        const bookContainer = document.getElementById("book");
        if (bookContainer) {
            bookContainer.addEventListener("click", (e) => {
                const slot = e.target.closest(".sticker-slot");
                if (!slot) return;
                if (slot.classList.contains("slot-preenchido")) return;

                const slotNumeroEl = slot.querySelector(".slot-number");
                const slotNameEl = slot.querySelector(".slot-name");
                if (!slotNumeroEl) return;

                const slotId = slotNumeroEl.textContent.trim(); // e.g. "#01"
                const slotName = slotNameEl ? slotNameEl.textContent.trim() : "";

                const slotNumValue = parseInt(slotId.replace("#", ""), 10);
                const isPlayerSlot = slotNumValue > 60;

                if (isPlayerSlot || !slotName) {
                    triggerManualUpload(slot, slotId);
                    return;
                }

                // Tenta carregar a imagem correspondente da pasta "fotos"
                const filename = getStickerFilename(slotName);
                const imgObj = new Image();
                
                imgObj.onload = () => {
                    // Imagem existe na pasta fotos: comprime e salva no localStorage
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    
                    const targetWidth = 300;
                    const targetHeight = 400;
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    
                    const imgRatio = imgObj.width / imgObj.height;
                    const targetRatio = targetWidth / targetHeight;
                    let srcX = 0, srcY = 0, srcW = imgObj.width, srcH = imgObj.height;
                    
                    if (imgRatio > targetRatio) {
                        srcW = imgObj.height * targetRatio;
                        srcX = (imgObj.width - srcW) / 2;
                    } else {
                        srcH = imgObj.width / targetRatio;
                        srcY = (imgObj.height - srcH) / 2;
                    }
                    
                    ctx.drawImage(imgObj, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);
                    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                    
                    localStorage.setItem(`sticker-${slotId}`, compressedDataUrl);
                    renderSticker(slot, compressedDataUrl, slotId);
                    playPaperTurnSound();
                };

                imgObj.onerror = () => {
                    // Fallback para seleção manual caso o arquivo não exista
                    console.warn(`Imagem fotos/${filename}.png não encontrada, usando seletor de arquivo.`);
                    triggerManualUpload(slot, slotId);
                };

                imgObj.src = `fotos/${filename}.png`;
            });
        }

        // Auxiliar: Normaliza o nome para o padrão kebab-case
        function getStickerFilename(slotName) {
            let name = slotName.trim().toLowerCase();
            if (name === "bigott") return "opferung";
            return name.replace(/[^a-z0-9]+/g, '-');
        }

        // Auxiliar: Abre o seletor de arquivos para upload manual
        function triggerManualUpload(slot, slotId) {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgObj = new Image();
                    imgObj.onload = () => {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        
                        const targetWidth = 300;
                        const targetHeight = 400;
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        
                        const imgRatio = imgObj.width / imgObj.height;
                        const targetRatio = targetWidth / targetHeight;
                        let srcX = 0, srcY = 0, srcW = imgObj.width, srcH = imgObj.height;
                        
                        if (imgRatio > targetRatio) {
                            srcW = imgObj.height * targetRatio;
                            srcX = (imgObj.width - srcW) / 2;
                        } else {
                            srcH = imgObj.width / targetRatio;
                            srcY = (imgObj.height - srcH) / 2;
                        }
                        
                        ctx.drawImage(imgObj, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);
                        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                        
                        localStorage.setItem(`sticker-${slotId}`, compressedDataUrl);
                        renderSticker(slot, compressedDataUrl, slotId);
                        playPaperTurnSound();
                    };
                    imgObj.src = event.target.result;
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }

        function renderSticker(slot, dataUrl, altName) {
            const existingImg = slot.querySelector(".sticker-img");
            if (existingImg) existingImg.remove();

            const img = document.createElement("img");
            img.src = dataUrl;
            img.alt = altName;
            img.className = "sticker-img";
            img.onload = () => slot.classList.add("slot-preenchido");
            slot.insertBefore(img, slot.firstChild);
        }

        // Manipulador de reset do álbum
        const albumReset = document.getElementById("album-reset");
        if (albumReset) {
            albumReset.addEventListener("click", () => {
                if (confirm("Are you sure you want to reset your Elsword Album collection? This will clear all your stickers.")) {
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith("sticker-")) {
                            localStorage.removeItem(key);
                        }
                    });
                    window.location.reload();
                }
            });
        }

    } catch (error) {
        console.error("Erro ao inicializar a biblioteca PageFlip:", error);
    }

    // 2. Sound Effect Generator (Web Audio API)
    function playPaperTurnSound() {
        if (isMuted) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const audioCtx = new AudioContext();
            const duration = 0.45; // seconds
            const sampleRate = audioCtx.sampleRate;
            const bufferSize = sampleRate * duration;
            const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);

            // Synthesize white noise with a custom page-flip volume envelope
            for (let i = 0; i < bufferSize; i++) {
                const progress = i / bufferSize;
                // Noise value between -1 and 1
                const noise = Math.random() * 2 - 1;

                // Volume envelope: smooth curve that peaks around 30% of the duration
                let envelope = 0;
                if (progress < 0.3) {
                    envelope = progress / 0.3; // Rapid ramp up
                } else {
                    envelope = (1 - progress) / 0.7; // Smooth decay
                }

                // Add minor irregular spikes to simulate paper friction/crackle
                const paperCrackle = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.35 : 0;

                data[i] = (noise * 0.65 + paperCrackle) * envelope * 0.12;
            }

            // Create nodes
            const noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = buffer;

            // Bandpass filter to extract the "whoosh" sound of paper shuffling
            const bandpassFilter = audioCtx.createBiquadFilter();
            bandpassFilter.type = "bandpass";
            bandpassFilter.Q.value = 2.0;

            // Dynamic frequency sweep: starts at 1500Hz, sweeps down to 350Hz (sound of page moving away)
            bandpassFilter.frequency.setValueAtTime(1500, audioCtx.currentTime);
            bandpassFilter.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + duration);

            // Lowpass filter to remove harsh high-frequency digital artifacts
            const lowpassFilter = audioCtx.createBiquadFilter();
            lowpassFilter.type = "lowpass";
            lowpassFilter.frequency.setValueAtTime(3800, audioCtx.currentTime);

            // Connect graph: Source -> Bandpass -> Lowpass -> Destination
            noiseNode.connect(bandpassFilter);
            bandpassFilter.connect(lowpassFilter);
            lowpassFilter.connect(audioCtx.destination);

            noiseNode.start();
        } catch (e) {
            console.warn("Falha ao tocar som de virada de página:", e);
        }
    }

    // 3. Audio State Controls
    soundToggle.addEventListener("click", () => {
        isMuted = !isMuted;
        if (isMuted) {
            iconOn.classList.add("hidden");
            iconOff.classList.remove("hidden");
        } else {
            iconOn.classList.remove("hidden");
            iconOff.classList.add("hidden");
        }
    });

    // 4. Navigation controls and events
    if (pageFlip) {
        // Play turn sound when page starts flipping
        pageFlip.on("changeState", (e) => {
            if (e.data === "flipping") {
                playPaperTurnSound();
            }
        });

        // Discrete arrow toggle depending on current page
        pageFlip.on("flip", (e) => {
            const currentPage = e.data;
            const totalPages = pageFlip.getPageCount();

            // Hide left button on cover page
            if (currentPage === 0) {
                btnPrev.classList.add("hidden");
            } else {
                btnPrev.classList.remove("hidden");
            }

            // Hide right button on back cover
            if (currentPage === totalPages - 1) {
                btnNext.classList.add("hidden");
            } else {
                btnNext.classList.remove("hidden");
            }
        });

        // Click events for navigational arrows
        btnPrev.addEventListener("click", () => {
            pageFlip.flipPrev();
        });

        btnNext.addEventListener("click", () => {
            pageFlip.flipNext();
        });

        // Keyboard events for navigational arrows
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                pageFlip.flipPrev();
            } else if (e.key === "ArrowRight") {
                pageFlip.flipNext();
            }
        });

        // Hide left button initially since start page is 0
        btnPrev.classList.add("hidden");
    }

    // 5. Theme Toggle Logic
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");
            const currentTheme = document.body.classList.contains("light-mode") ? "light" : "dark";
            localStorage.setItem("album-theme", currentTheme);
            playPaperTurnSound();
        });
    }
});
