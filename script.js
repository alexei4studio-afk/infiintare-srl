/*=============================================================================
   Înființare SRL - Interactivity & Main Script
=============================================================================*/

// TBT Optimization: Load jsPDF dynamically only when needed
let jsPDFLoadingPromise = null;
function loadJsPDF() {
    if (window.jspdf) return Promise.resolve(window.jspdf);
    if (!jsPDFLoadingPromise) {
        jsPDFLoadingPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.onload = () => resolve(window.jspdf);
            script.onerror = () => reject(new Error("Eroare la încărcarea jsPDF"));
            document.body.appendChild(script);
        });
    }
    return jsPDFLoadingPromise;
}

// ============================================================
// SUCCESS MODAL LOGIC (Globally defined for early access)
// ============================================================
window.showSuccessModal = function () {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
};

window.closeSuccessModal = function () {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scroll
        // Clean up URL without refreshing
        const url = new URL(window.location);
        url.searchParams.delete('success');
        window.history.pushState({}, '', url);
    }
};

window.verifyAndShowModal = async function (sessionId) {
    const modal = document.getElementById('success-modal');
    const btn = document.getElementById('modal-download-btn');
    if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    if (btn) { btn.innerHTML = '<i class="ri-loader-4-line"></i> Se verifica plata...'; btn.disabled = true; }
    try {
        const response = await fetch('/api/verify-payment?session_id=' + encodeURIComponent(sessionId));
        const data = await response.json();
        if (data.valid) {
            const url = new URL(window.location);
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url);
            if (btn) { btn.innerHTML = '<i class="ri-file-download-fill"></i> DESCARCA DOSARUL (PDF)'; btn.disabled = false; }
        } else {
            if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
            alert('Plata nu a putut fi verificata. Contacteaza-ne pe WhatsApp: 0733874143');
        }
    } catch (err) {
        console.error('Verify error:', err);
        if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
        alert('Eroare la verificarea platii. Contacteaza-ne pe WhatsApp: 0733874143');
    }
};
// Reset app to Step 1
window.resetToStep1 = function () {
    // Hide all steps
    document.querySelectorAll('.step-container').forEach(step => {
        step.classList.remove('active');
    });

    // Show Step 1
    const step1 = document.getElementById('step-1');
    if (step1) step1.classList.add('active');

    // Update URL
    window.location.hash = 'app';

    // Scroll to top
    window.scrollTo(0, 0);
};

// Reset app to Step 1
window.resetToStep1 = function () {
    // Hide all steps
    document.querySelectorAll('.step-container').forEach(step => {
        step.classList.remove('active');
    });

    // Show Step 1
    const step1 = document.getElementById('step-1');
    if (step1) step1.classList.add('active');

    // Reset form data (optional - șterge dacă vrei să păstrezi datele)
    document.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type !== 'radio' && input.type !== 'checkbox') {
            input.value = '';
        }
    });

    // Update URL
    window.location.hash = 'app';

    // Scroll to top
    window.scrollTo(0, 0);
};
window.triggerModalDownload = function () {
    const btn = document.getElementById('modal-download-btn');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> SE GENEREAZA...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    setTimeout(async () => {
        try {
            await window.generateAndDownloadPDF();
            btn.innerHTML = '<i class="ri-check-line"></i> DOSAR DESCARCAT!';
            btn.style.background = 'var(--secondary-color)';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = 'var(--primary-color)';
            }, 3000);
        } catch (err) {
            console.error(err);
            btn.innerHTML = 'EROARE. REINCEARCA!';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }, 500);
};

document.addEventListener("DOMContentLoaded", () => {
    // Verificare Stripe session_id dupa redirect de la plata
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId && (sessionId.startsWith('cs_live_') || sessionId.startsWith('cs_test_'))) {
        window.verifyAndShowModal(sessionId);
    }

    // ── INTERSECTION OBSERVER pentru fade-in ─────────────────
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-element').forEach(el => fadeObserver.observe(el));

    // ── SCROLL HERO — slide per scroll + zoom clădire ──────
    const heroImgEl = document.getElementById('hero-img');
    const buildingContainerEl = document.querySelector('.building-container');
    const slides = document.querySelectorAll('.hero-slide');

    // Intersection Observer - fiecare slide apare când intră în viewport
    if (slides.length) {
        const slideObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.4 });

        slides.forEach(slide => slideObserver.observe(slide));
    }

    // Zoom clădire cu vârful mereu vizibil pe toată durata hero
    if (heroImgEl) {
        // Calculează înălțimea totală a hero-ului
        // Slide 1 = 100vh, restul = 50vh
        const totalHeroHeight = window.innerHeight + (slides.length - 1) * (window.innerHeight * 0.5);
        const minZoom = 1.1; // Scara inițială: 1.1
        const maxZoom = 1.6; // Zoom maxim: 1.6 (efect mai dramatic)

        // Easing function pentru transition mai smooth
        function easeOutQuad(t) {
            return t * (2 - t);
        }

        window.addEventListener('scroll', () => {
            const scrollVal = window.scrollY;

            // Calculează progresul în procente în secțiunea hero (0 - 1)
            const heroProgress = Math.min(scrollVal / totalHeroHeight, 1);

            // Aplică easing pentru tranziție mai fluidă
            const easedProgress = easeOutQuad(heroProgress);

            // Calculează scala: de la 1.1 la 1.6, cu vârful rămânând vizibil (transform-origin: top center)
            const scale = minZoom + (easedProgress * (maxZoom - minZoom));
            heroImgEl.style.transform = `scale(${scale})`;

            // Ascunde clădirea după ultimul slide cu tranziție smooth
            if (buildingContainerEl) {
                const fadeOutStart = totalHeroHeight * 0.85; // Incepe să dispară la 85%
                const fadeOutEnd = totalHeroHeight * 1.1;

                let opacity = 1;
                if (scrollVal > fadeOutStart) {
                    opacity = Math.max(0, 1 - (scrollVal - fadeOutStart) / (fadeOutEnd - fadeOutStart));
                }

                buildingContainerEl.style.opacity = opacity.toString();

                if (scrollVal > fadeOutEnd) {
                    buildingContainerEl.style.pointerEvents = 'none';
                } else {
                    buildingContainerEl.style.pointerEvents = 'auto';
                }
            }
        }, { passive: true });
    }

    // Intersection Observer pentru secțiunile hero
    // Intersection Observer pentru secțiunile hero
    // Intersection Observer pentru secțiunile hero
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('.content-scroller section').forEach(section => {
        heroObserver.observe(section);
    });

    // ── CHATBOT — buton înapoi la meniu ──────────────────────
    // ── CHATBOT — buton înapoi la meniu ──────────────────────
    window.showChatMenu = function () {
        const suggestions = document.getElementById('chat-suggestions');
        const backBtn = document.getElementById('chat-back-btn');
        if (suggestions) suggestions.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'none';
    };

    // 1. Navigation Sticky Background on Scroll
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Offset for fixed navbar
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const offsetPosition = targetElement.offsetTop - navbarHeight - 20;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // 3. Multi-Step SaaS Application Logic
    // Step order for progress tracking
    const STEP_ORDER = ['step-1', 'step-2', 'step-verify', 'step-3'];
    const INDICATOR_ORDER = ['step-1-indicator', 'step-2-indicator', 'step-verify-indicator', 'step-3-indicator'];

    window.nextStep = function (stepNumber) {
        // Hide all steps
        document.querySelectorAll('.app-step').forEach(step => {
            step.classList.remove('active-step');
        });

        // Show target step
        document.getElementById(`step-${stepNumber}`).classList.add('active-step');

        // Calculate which indicator index matches this stepNumber
        const targetId = `step-${stepNumber}`;
        const targetIdx = STEP_ORDER.indexOf(targetId);

        // Update indicators
        INDICATOR_ORDER.forEach((id, index) => {
            const indicator = document.getElementById(id);
            if (!indicator) return;
            if (index < targetIdx) {
                indicator.classList.add('active');
            } else if (index === targetIdx) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });

        // Smooth scroll to top of app
        document.getElementById('app').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    window.handleEntityChange = function () {
        const tipFirma = document.getElementById('tip-firma').value;
        const capitalGroup = document.getElementById('capital-group');

        if (tipFirma === 'PFA') {
            capitalGroup.style.display = 'none';
            document.getElementById('capital').required = false;
        } else {
            capitalGroup.style.display = 'block';
            document.getElementById('capital').required = true;
        }

        // Actualizeaza descrierea step 1 dinamic
        const stepDesc = document.querySelector('#step-1 .step-desc');
        if (stepDesc) {
            if (tipFirma === 'PFA') {
                stepDesc.textContent = 'Datele Titularului PFA pentru redactarea documentelor.';
            } else {
                stepDesc.textContent = 'Datele Asociatului Unic și Administratorului pentru redactarea documentelor.';
            }
        }
    };

    window.goToVerifyStep = function () {
        const tipFirma = document.getElementById('tip-firma').value;
        let numeFirmaRaw = document.getElementById('nume-firma').value || 'Compania Ta';
        let numeFirmaCurat = numeFirmaRaw.replace(/srl-d/gi, '').replace(/srl/gi, '').replace(/pfa/gi, '').trim();

        let numeFirmaFinal;
        if (tipFirma === 'PFA') {
            const titular = document.getElementById('nume').value || 'NUME PRENUME';
            numeFirmaFinal = `${titular.toUpperCase()} PFA`;
        } else {
            numeFirmaFinal = `${numeFirmaCurat} ${tipFirma}`;
        }

        // Show name in verify step
        document.getElementById('verify-display-name').textContent = numeFirmaFinal;

        // Hide all steps
        document.querySelectorAll('.app-step').forEach(step => step.classList.remove('active-step'));
        document.getElementById('step-verify').classList.add('active-step');

        // Update progress indicators - step-verify is index 2
        INDICATOR_ORDER.forEach((id, index) => {
            const indicator = document.getElementById(id);
            if (!indicator) return;
            if (index <= 2) indicator.classList.add('active');
            else indicator.classList.remove('active');
        });

        // Reset confirmation state
        document.getElementById('confirm-rezervare').checked = false;
        document.getElementById('btn-continue-analysis').disabled = true;

        document.getElementById('app').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    window.openONRCVerify = function () {
        // Open the official ONRC portal for denomination verification
        window.open('https://myportal.onrc.ro/', '_blank');
    };

    window.checkRezervarConfirm = function () {
        const checked = document.getElementById('confirm-rezervare').checked;
        document.getElementById('btn-continue-analysis').disabled = !checked;
    };

    window.toggleGenerateButton = function () {
        const checked = document.getElementById('gdpr-checkbox').checked;
        const btn = document.getElementById('btn-generate-pay');
        if (checked) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
        }
    };

    // --- CAEN SELECTOR LOGIC ---
    // ============================================================
    // La începutul fișierului script.js sau unde ai configurarea Stripe
    const stripe = Stripe('pk_test_51T8lr86ycU9oSPnkpyWgqCRP2bCDfE9JmXgAJkQCKHtAWtuAFZMbFGH7QB3hdcVjiHsTs90VtuFIkkCc3u2bKrXh00HL4MfAoK');

    async function initiatePayment(amount) {
        try {
            // Aici codul tău va crea sesiunea de plată
            console.log("Inițiere plată pentru suma de: " + amount + " RON");

            // Dacă folosești Stripe Checkout (cea mai simplă metodă):
            // stripe.redirectToCheckout({ sessionId: '...' });

        } catch (error) {
            console.error("Eroare Stripe:", error);
            alert("Eroare la inițierea plății. Verifică consola.");
        }
    }
    // CONFIGURARE LINK-URI STRIPE (Schimbă aici cu link-urile tale)
    // ============================================================

    const STRIPE_LINKS = {
        SRL_DIGITAL: "https://buy.stripe.com/fZu6oA8ou4rPeTt8vo2go00",
        PFA_DIGITAL: "https://buy.stripe.com/fZuaEQ0W2e2pbHh8vo2go03", // Link-ul tău nou pentru PFA
        PACHET_COMPLET: "https://buy.stripe.com/00w9AM8ou7E1fXx6ng2go02"
    };

    const CAEN_LIST = [
        { code: "6201", desc: "Activități de realizare a software-ului la comandă (it, programare, site-uri)" },
        { code: "6202", desc: "Activități de consultanță în tehnologia informației" },
        { code: "6209", desc: "Alte activități de servicii privind tehnologia informației" },
        { code: "6311", desc: "Prelucrarea datelor, administrarea paginilor web" },
        { code: "7022", desc: "Activități de consultanță pentru afaceri și management" },
        { code: "7311", desc: "Activități ale agențiilor de publicitate (marketing, reclame)" },
        { code: "7410", desc: "Activități de design specializat (grafică, decorare)" },
        { code: "7420", desc: "Activități fotografice" },
        { code: "8559", desc: "Alte forme de învățământ (cursuri, training, meditații)" },
        { code: "9003", desc: "Activități de creație artistică" },
        { code: "4791", desc: "Comerț cu amănuntul prin intermediul caselor de comenzi sau prin Internet" },
        { code: "5610", desc: "Restaurante" },
        { code: "5630", desc: "Baruri și alte activități de servire a băuturilor" },
        { code: "9602", desc: "Coafură și alte activități de înfrumusețare" },
        { code: "4120", desc: "Lucrări de construcții a clădirilor rezidențiale și nerezidențiale" },
        { code: "4321", desc: "Lucrări de instalații electrice" },
        { code: "4322", desc: "Lucrări de instalații sanitare, de încălzire și de aer condiționat" },
        { code: "4520", desc: "Întreținerea și repararea autovehiculelor" },
        { code: "4932", desc: "Transporturi cu taxiuri" },
        { code: "5320", desc: "Alte activități poștale și de curier" }
    ];

    window.searchCAEN = function () {
        const input = document.getElementById('caen');
        const resultsBox = document.getElementById('caen-results');
        const query = input.value.toLowerCase().trim();

        if (query.length < 2) {
            resultsBox.innerHTML = '';
            resultsBox.style.display = 'none';
            return;
        }

        const filtered = CAEN_LIST.filter(item =>
            item.code.includes(query) || item.desc.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            resultsBox.innerHTML = '<div class="search-no-results">Nu am găsit acest cod. Îl poți scrie manual.</div>';
            resultsBox.style.display = 'block';
            return;
        }

        resultsBox.innerHTML = filtered.map(item => `
            <div class="search-result-item" onclick="selectCAEN('${item.code}', '${item.desc}')">
                <strong>${item.code}</strong> - ${item.desc}
            </div>
        `).join('');
        resultsBox.style.display = 'block';
    };

    window.selectCAEN = function (code, desc) {
        const input = document.getElementById('caen');
        const resultsBox = document.getElementById('caen-results');
        input.value = `${desc} (${code})`;
        resultsBox.innerHTML = '';
        resultsBox.style.display = 'none';
        // Force update localStorage if needed or let the existing simulateAIAnalysis handle it
    };

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            const resultsBox = document.getElementById('caen-results');
            if (resultsBox) resultsBox.style.display = 'none';
        }
    });

    window.simulateAIAnalysis = function () {
        // Obține tipul de firmă și numele, eliminând posibile duplicități scrise de utilizator
        const tipFirma = document.getElementById('tip-firma').value;
        let numeFirmaRaw = document.getElementById('nume-firma').value || 'Compania Ta';
        const nrRezervare = document.getElementById('nr-rezervare') ? document.getElementById('nr-rezervare').value : '';

        // Curățare în caz că utilizatorul a scris "SRL" în câmpul de nume
        let numeFirmaCurat = numeFirmaRaw.replace(/srl-d/gi, '').replace(/srl/gi, '').replace(/pfa/gi, '').trim();

        let numeFirmaFinal;
        if (tipFirma === 'PFA') {
            const titular = document.getElementById('nume').value || 'NUME PRENUME';
            numeFirmaFinal = `${titular.toUpperCase()} PFA`;
        } else {
            numeFirmaFinal = `${numeFirmaCurat} ${tipFirma}`;
        }

        document.getElementById('display-nume-firma').textContent = numeFirmaFinal;

        // Salvare date in localStorage pentru generarea ulterioara a PDF-ului
        localStorage.setItem('srl_nume', document.getElementById('nume').value);
        localStorage.setItem('srl_cnp', document.getElementById('cnp').value);
        localStorage.setItem('srl_data_nasterii', document.getElementById('data-nasterii').value);
        localStorage.setItem('srl_loc_nastere', document.getElementById('loc-nastere').value);
        localStorage.setItem('srl_ci_serie', document.getElementById('ci-serie').value);
        localStorage.setItem('srl_ci_numar', document.getElementById('ci-numar').value);
        localStorage.setItem('srl_ci_eliberat', document.getElementById('ci-eliberat').value);
        localStorage.setItem('srl_ci_data', document.getElementById('ci-data').value);
        localStorage.setItem('srl_telefon', document.getElementById('telefon').value);
        localStorage.setItem('srl_email', document.getElementById('email').value);
        localStorage.setItem('srl_adresa_buletin', document.getElementById('adresa-buletin').value);
        localStorage.setItem('srl_tip_firma', tipFirma);
        localStorage.setItem('srl_nume_firma', numeFirmaFinal);
        localStorage.setItem('srl_nr_rezervare', nrRezervare);
        localStorage.setItem('srl_caen', document.getElementById('caen').value);
        localStorage.setItem('srl_sediu', document.getElementById('sediu').value);
        localStorage.setItem('srl_capital', tipFirma === 'PFA' ? '0' : document.getElementById('capital').value);
        localStorage.setItem('srl_sediu_bloc', document.getElementById('sediu-bloc').checked ? 'da' : 'nu');
        localStorage.setItem('srl_comodant_nume', document.getElementById('comodant-nume').value);
        localStorage.setItem('srl_comodant_ci', document.getElementById('comodant-ci').value);
        localStorage.setItem('srl_comodant_cnp', document.getElementById('comodant-cnp').value);
        localStorage.setItem('srl_document_proprietate', document.getElementById('document-proprietate').value);

        // Move to Step 3 (using custom logic since step-verify is between 2 and 3)
        document.querySelectorAll('.app-step').forEach(step => step.classList.remove('active-step'));
        document.getElementById('step-3').classList.add('active-step');
        INDICATOR_ORDER.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.classList.add('active');
        });
        document.getElementById('app').scrollIntoView({ behavior: 'smooth', block: 'start' });

        const loader = document.getElementById('ai-loader');
        const results = document.getElementById('pricing-results');
        const statusText = document.getElementById('loading-text');
        const progressBar = document.getElementById('loading-progress');

        loader.classList.remove('hidden');
        results.classList.add('hidden');
        progressBar.style.width = '0%';

        // Simulare procesare in etape
        const steps = [
            { text: "Verificare validitate CNP și date titular...", progress: 20, time: 500 },
            { text: "Verificare disponibilitate nume firmă la ONRC...", progress: 45, time: 2000 },
            { text: "Analizare coduri CAEN și autorizații necesare...", progress: 70, time: 3500 },
            { text: "Generare Act Constitutiv și Declarații...", progress: 90, time: 5000 },
            { text: "Calculare taxe finale. Finalizare...", progress: 100, time: 6500 }
        ];

        steps.forEach(step => {
            setTimeout(() => {
                statusText.textContent = step.text;
                progressBar.style.width = `${step.progress}%`;
            }, step.time);
        });

        // Afișare rezultate
        setTimeout(() => {
            loader.classList.add('hidden');
            results.classList.remove('hidden');

            // Add tiny reveal animation
            results.style.opacity = 0;
            results.style.transform = 'translateY(20px)';
            results.style.transition = 'all 0.5s ease';

            setTimeout(() => {
                results.style.opacity = 1;
                results.style.transform = 'translateY(0)';
            }, 50);

            // Add PFA specific guidance if PFA
            if (tipFirma === 'PFA') {
                const pfaGuidance = `
                    <div class="pfa-guidance-box glass-panel" style="margin-top: 2rem; padding: 1.5rem; border-color: var(--secondary-color);">
                        <h4 style="color: var(--secondary-color); margin-bottom: 1rem;"><i class="ri-information-line"></i> Ghid Pas-cu-Pas PFA pentru Martie</h4>
                        <ol style="color: var(--text-muted); font-size: 0.9rem; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem;">
                            <li><strong>Reducere 50%:</strong> Prețul tău este de doar 50 RON (aplicat automat).</li>
                            <li><strong>Pregătire Acte:</strong> După plată, vei descărca Cererea de Înregistrare și Declarația.</li>
                            <li><strong>Diplomă/Calificare:</strong> Asigură-te că ai o copie după diploma de studii sau cursuri în domeniul ales.</li>
                            <li><strong>Depunere:</strong> Tot dosarul se depune online pe portalul ONRC (link-ul actualizat te va ghida).</li>
                        </ol>
                    </div>
                `;
                results.insertAdjacentHTML('beforeend', pfaGuidance);
            }

        }, 7500); // Total wait time 7.5s
    };

    window.initiatePayment = async function (amount) {
        const clickedBtn = document.activeElement;
        if (clickedBtn && (clickedBtn.tagName === 'BUTTON' || clickedBtn.tagName === 'A')) {
            clickedBtn.innerHTML = '<i class="ri-loader-4-line"></i> Se procesează...';
            clickedBtn.disabled = true;
        }

        const tipFirma = localStorage.getItem('srl_tip_firma') || 'SRL';
        const numeFirma = localStorage.getItem('srl_nume_firma') || '';
        const nume = localStorage.getItem('srl_nume') || '';
        const email = localStorage.getItem('srl_email') || '';

        if (!email) {
            alert('Eroare: adresa de email lipseste. Te rugam sa completezi din nou formularul.');
            if (clickedBtn) {
                clickedBtn.innerHTML = '← Inapoi la Formular';
                clickedBtn.disabled = false;
                clickedBtn.onclick = function () {
                    resetToStep1();
                };
            }
            return;
        }
        try {
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: String(amount), tipFirma, numeFirma, email, nume })
            });

            const data = await response.json();

            if (!response.ok || !data.url) {
                throw new Error(data.error || 'Nu s-a putut crea sesiunea de plata.');
            }

            window.location.href = data.url;

        } catch (err) {
            console.error('Payment error:', err);
            alert('A aparut o eroare la initierea platii: ' + err.message);
            if (clickedBtn) { clickedBtn.innerHTML = 'Reincearca'; clickedBtn.disabled = false; }
        }
    };

    // Flag to prevent multiple jsPDF loads
    let jsPDFLoaded = false;

    // Function to load jsPDF library on demand
    function loadJsPDF() {
        return new Promise((resolve, reject) => {
            if (jsPDFLoaded) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; // Using CDN for simplicity
            script.onload = () => {
                jsPDFLoaded = true;
                resolve();
            };
            script.onerror = () => {
                console.error("Failed to load jsPDF library.");
                reject(new Error("Failed to load jsPDF library."));
            };
            document.head.appendChild(script);
        });
    }

    // === PDF GENERATOR (Complet revizuit) ===
    window.generateAndDownloadPDF = async function (tipFirmaOverride = null) {
        try {
            // Load PDF library on demand to save Total Blocking Time on mobile
            await loadJsPDF();

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ format: "a4", unit: "mm" });

            // Preluare date din LocalStorage
            const entityType = tipFirmaOverride || localStorage.getItem('srl_tip_firma') || 'SRL';
            const nume = localStorage.getItem('srl_nume') || '[Nume Complet]';
            const cnp = localStorage.getItem('srl_cnp') || '[CNP]';
            const dataNasterii = localStorage.getItem('srl_data_nasterii') || '[Data Nasterii]';
            const locNastere = localStorage.getItem('srl_loc_nastere') || '[Locul Nasterii]';
            const ciSerie = localStorage.getItem('srl_ci_serie') || '[Seria]';
            const ciNumar = localStorage.getItem('srl_ci_numar') || '[Numarul]';
            const ciEliberat = localStorage.getItem('srl_ci_eliberat') || '[Emitent]';
            const ciData = localStorage.getItem('srl_ci_data') || '[Data Eliberarii]';
            const adresaBuletin = localStorage.getItem('srl_adresa_buletin') || '[Adresa Completa]';
            const numeFirma = localStorage.getItem('srl_nume_firma') || '[Nume Firma]';
            const nrRezervare = localStorage.getItem('srl_nr_rezervare') || '[Numar Rezervare]';
            const caenStr = localStorage.getItem('srl_caen') || '0000 - Activitate';
            let sediu = localStorage.getItem('srl_sediu') || '[Adresa Sediu]';
            let targetTribunal = sediu && sediu.includes(',') ? sediu.split(',')[0] : sediu;
            const capital = localStorage.getItem('srl_capital') || '200';
            const dataCurenta = new Date().toLocaleDateString('ro-RO');

            // Initializing Romanian diacritics mapper for PDF compatibility with standard fonts
            const normalizeText = (text) => {
                if (!text) return "";
                const mapping = {
                    'ă': 'a', 'Ă': 'A', 'â': 'a', 'Â': 'A',
                    'î': 'i', 'Î': 'I', 'ș': 's', 'Ș': 'S',
                    'ț': 't', 'Ț': 'T'
                };
                return text.split('').map(char => mapping[char] || char).join('');
            };

            // Helper for text wrapping with page break support and character normalization
            const addWrappedText = (text, y, fontSize = 11, align = "left") => {
                const cleanText = normalizeText(text);
                doc.setFontSize(fontSize);
                const lines = doc.splitTextToSize(cleanText, 170);
                // line-height 1.5 calculat precis ținând cont că 1 pt = 0.352778 mm
                const lineHeight = fontSize * 0.352778 * 1.5;
                const pageHeight = doc.internal.pageSize.getHeight();

                lines.forEach(line => {
                    if (y + lineHeight > pageHeight - 20) { // bottom padding / subsol
                        doc.addPage();
                        y = 20; // top margin
                    }
                    doc.text(line, align === "center" ? 105 : 20, y, { align: align === "center" ? "center" : "left" });
                    y += lineHeight;
                });
                return y;
            };

            const ensureSpace = (currentY, neededSpace) => {
                const pageHeight = doc.internal.pageSize.getHeight();
                if (currentY + neededSpace > pageHeight - 20) {
                    doc.addPage();
                    return 20;
                }
                return currentY;
            };

            // === PAGINA 1 - INSTRUCTIUNI DE ASAMBLARE ===
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // Dark blue
            doc.text("INSTRUCTIUNI DE ASAMBLARE", 105, 35, null, null, "center");
            doc.setFontSize(14);
            doc.text("(Pagina informativa - NU se depune la ONRC)", 105, 43, null, null, "center");

            doc.setDrawColor(220, 226, 230);
            doc.line(30, 55, 180, 55);

            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);

            let ghidY = 70;
            const instrucțiuni = `Imprimare: Printeaza toate actele (recomandat doar pe o fata).

Organizare:
• Formularele pentru banca: Pune-le intr-o folie transparenta.
• Formularele pentru dosar: Pune-le intr-un dosar cu sina, in ordinea numerotarii. Scrie pe dosar: INMATRICULARE ${normalizeText(numeFirma.toUpperCase())}.
• Anexa la dosar: Se capseaza pe coperta interioara a dosarului.

Semnaturi Vecini: Daca sediul e la bloc, mergi la cei 2 vecini si la administrator pentru semnatura pe formularul de Asociatie.

Completare: Vei gasi in PDF foi de tip separator pe care scrie 'INLOCUITI ACEASTA FOAIE CU...'. Inlocuieste-le conform instructiunii de pe fiecare cu: copia CI (semnata), chitanta de capital de la banca, etc.`;

            ghidY = addWrappedText(instrucțiuni, ghidY, 12);

            // === PAGINA 2 - ETICHETA DOSAR ===
            doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59);
            doc.text("Eticheta Dosar (Pentru coperta dosar cu sina)", 105, 30, null, null, "center");

            let targetLocatie = sediu;
            if (sediu && sediu.includes(',')) {
                targetLocatie = sediu.split(',')[0];
            }

            // Draw dotted rectangle (approx 150x100mm)
            doc.setLineDashPattern([2, 5], 0);
            doc.setDrawColor(0, 0, 0);
            doc.rect(30, 50, 150, 100);
            doc.setLineDashPattern([], 0); // reset

            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("INMATRICULARE", 105, 75, null, null, "center");

            doc.setFontSize(16);
            doc.text(normalizeText(numeFirma.toUpperCase()), 105, 90, null, null, "center");

            doc.setFont("helvetica", "normal");
            doc.setFontSize(14);
            doc.text(`Solicitant: ${normalizeText(nume)}`, 105, 110, null, null, "center");
            doc.text(`Judet/Sector: ${normalizeText(targetLocatie)}`, 105, 120, null, null, "center");
            doc.text(`Data asamblarii: ${dataCurenta}`, 105, 130, null, null, "center");

            doc.setFontSize(11);
            doc.setTextColor(110, 120, 130);
            doc.text("Decupati pe linia punctata si lipiti pe coperta dosarului cu sina.", 105, 160, null, null, "center");

            doc.setTextColor(0, 0, 0);

            // Helper pentru separatoare
            const renderSeparator = (text) => {
                doc.addPage();
                doc.setDrawColor(30, 41, 59);
                doc.setLineWidth(1);
                doc.rect(20, 20, 170, 257); // Big border

                doc.setTextColor(30, 41, 59);
                doc.setFontSize(24);
                doc.setFont("helvetica", "bold");

                const lines = doc.splitTextToSize(normalizeText(text), 150);
                let textY = 148 - (lines.length * 12 / 2); // roughly center

                lines.forEach(line => {
                    doc.text(line, 105, textY, null, null, "center");
                    textY += 15;
                });
                doc.setFont("helvetica", "normal"); // reset
                doc.setLineWidth(0.2); // reset
            };
            const renderModuleCover = (title, subtitle) => {
                doc.addPage();
                doc.setFillColor(30, 41, 59); // Dark blue background for tab
                doc.rect(0, 0, 210, 297, "F");

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(36);
                doc.setFont("helvetica", "bold");
                doc.text(normalizeText(title), 105, 120, null, null, "center");

                doc.setFontSize(16);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(148, 163, 184); // Slate 400
                doc.text(normalizeText(subtitle), 105, 140, null, null, "center");

                // Return to normal color for next pages
                doc.setTextColor(0, 0, 0);
            };

            const renderFormField = (label, value, x, y, width, fontSize = 11) => {
                doc.setFontSize(fontSize);
                doc.setFont("helvetica", "normal");
                doc.text(normalizeText(label), x, y);

                const labelWidth = doc.getTextWidth(normalizeText(label)) + 2;
                const valueX = x + labelWidth;
                const availableWidth = width - labelWidth;

                // Draw dotted line
                doc.setLineDashPattern([0.5, 1], 0);
                doc.line(valueX, y + 1, x + width, y + 1);
                doc.setLineDashPattern([], 0);

                if (value) {
                    let currentFontSize = fontSize;
                    doc.setFontSize(currentFontSize);
                    while (doc.getTextWidth(normalizeText(value)) > availableWidth && currentFontSize > 8) {
                        currentFontSize -= 0.5;
                        doc.setFontSize(currentFontSize);
                    }
                    doc.text(normalizeText(value), valueX, y);
                }
                doc.setFontSize(fontSize); // reset
            };

            const renderCheckbox = (label, x, y, isChecked) => {
                doc.rect(x, y - 4, 4, 4); // 4x4mm box
                if (isChecked) {
                    doc.setFont("helvetica", "bold");
                    doc.text("X", x + 1, y - 1);
                    doc.setFont("helvetica", "normal");
                }
                doc.text(normalizeText(label), x + 6, y);
            };

            // ==========================================
            // MODUL 1: BANCĂ (Act Constitutiv, Cerere Capital)
            // ==========================================
            renderModuleCover("MODUL 1", "Formulare pentru Banca");

            // --- 1.1 ACT CONSTITUTIV (DOAR SRL/SRL-D) ---
            let currentY = 20;
            const pageHeight = doc.internal.pageSize.getHeight();

            if (entityType === 'SRL' || entityType === 'SRL-D') {
                doc.addPage();
                doc.setFontSize(16);
                doc.text("ACT CONSTITUTIV", 105, 20, null, null, "center");
                doc.setFontSize(14);
                let titleAditional = entityType === 'SRL-D' ? " - MICROINTREPRINDERE DEBUTANT" : "";
                doc.text(normalizeText(`al Societatii ${numeFirma}${titleAditional}`), 105, 30, null, null, "center");

                currentY = 50;
                const introAct = `Subsemnatul/a ${nume}, cetatean roman, nascut(a) la data de ${dataNasterii}, in ${locNastere}, domiciliat(a) in ${adresaBuletin}, identificat(a) cu C.I. seria ${ciSerie} nr. ${ciNumar}, eliberat(a) de ${ciEliberat} la data de ${ciData}, C.N.P. ${cnp},

In calitate de asociat unic, am hotarat infiintarea unei societati cu raspundere limitata, in conformitate cu dispozitiile Legii nr. 31/1990 privind societatile comerciale, republicata, cu modificarile si completarile ulterioare, adoptand prezentul act constitutiv:

CAP. I. DENUMIREA, FORMA JURIDICA, SEDIUL, DURATA
Art. 1. Denumirea societatii este "${numeFirma}" (rezervare denumire nr. ${nrRezervare}).
Art. 2. Forma juridica. Societatea este persoana juridica romana, avand forma de societate cu raspundere limitata${entityType === 'SRL-D' ? ' (debutant)' : ''}.
Art. 3. Sediul social este in Romania, localitatea ${sediu}.
Art. 4. Durata societatii este nedeterminata.

CAP. II. OBIECTUL DE ACTIVITATE PENTRU CARE OPTEAZA
Art. 5. Domeniul principal de activitate este: ${caenStr}.

CAP. III. CAPITALUL SOCIAL
Art. 6. Capitalul social subscris si varsat este de ${capital} lei, impartit in ${Math.floor(capital / 10)} parti sociale a cate 10 lei fiecare, detinute in totalitate de asociatul unic ${nume}.

CAP. IV. CONDUCEREA SI ADMINISTRAREA SOCIETATII
Art. 7. Administrarea societatii este realizata de ${nume}, pe o perioada nedeterminata, avand puteri depline de reprezentare si administrare.`;

                currentY = addWrappedText(introAct, currentY);

                // Check signature space dynamically
                let sigY = ensureSpace(currentY + 10, 40);
                doc.text(normalizeText("Semnatura Asociat Unic,"), 120, sigY);
                doc.text(normalizeText(`Nume Prenume: ${nume}`), 120, sigY + 10);
                doc.text("Semnatura: ___________________", 120, sigY + 20);
                doc.text(`Data: ${dataCurenta}`, 120, sigY + 30);

                // --- 1.2 CERERE VARSARE CAPITAL SOCIAL ---
                doc.addPage();
                doc.setFontSize(16);
                doc.text("CERERE VARSARE CAPITAL SOCIAL", 105, 20, null, null, "center");

                let capY = 40;
                const textCapital = `Catre,
BANCA COMERCIALA [REPREZENTANTA BANCARA]

Subsemnatul/a ${nume}, in calitate de asociat unic al societatii ${numeFirma} (in curs de constituire), solicit deschiderea contului pentru varsarea capitalului social.

Declar ca suma de ${capital} RON reprezinta capitalul social subscris conform Actului Constitutiv.

Data: ${dataCurenta}
Semnatura, ___________________`;

                addWrappedText(textCapital, capY);
            }

            // ==========================================
            // MODUL 1B: DOCUMENTE SPECIFICE PFA
            // ==========================================
            if (entityType === 'PFA') {
                // PFA nu are Act Constitutiv - in schimb are Cerere Inregistrare PFA specifica
                doc.addPage();
                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.text("CERERE DE INREGISTRARE PFA", 105, 20, null, null, "center");
                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);

                let pfaCerY = 40;
                const pfaNumeComplet = normalizeText(nume.toUpperCase());
                // Titlul PFA = PRENUME NUME PFA conform legislatiei
                const pfaDenumire = normalizeText(numeFirma);

                doc.text(normalizeText("CATRE: OFICIUL REGISTRULUI COMERTULUI DE PE LANGA TRIBUNALUL " + targetTribunal.toUpperCase()), 20, pfaCerY);
                pfaCerY += 15;

                const pfaTextCerere = `Subsemnatul/a ${normalizeText(nume)}, cetatean roman, nascut(a) la data de ${dataNasterii}, in ${normalizeText(locNastere)}, domiciliat(a) in ${normalizeText(adresaBuletin)}, identificat(a) cu C.I. seria ${ciSerie} nr. ${ciNumar}, eliberat(a) de ${normalizeText(ciEliberat)} la data de ${ciData}, C.N.P. ${cnp},

solicit inregistrarea in registrul comertului si autorizarea functionarii ca PERSOANA FIZICA AUTORIZATA, conform prevederilor OUG nr. 44/2008 privind desfasurarea activitatilor economice de catre persoanele fizice autorizate.

DATE PRIVIND PFA:
Denumire PFA: ${pfaDenumire}
Sediu profesional: ${normalizeText(sediu)}
Activitate principala: ${normalizeText(caenStr)}

Solicit eliberarea certificatului de inregistrare.`;

                pfaCerY = addWrappedText(pfaTextCerere, pfaCerY, 11);
                pfaCerY = ensureSpace(pfaCerY + 10, 40);
                doc.text("Semnatura Solicitant,", 120, pfaCerY);
                doc.text(normalizeText(`Nume: ${nume}`), 120, pfaCerY + 10);
                doc.text("Semnatura: ___________________", 120, pfaCerY + 20);
                doc.text(`Data: ${dataCurenta}`, 120, pfaCerY + 30);

                // SEPARATOR - Diploma/Calificare
                renderSeparator("INLOCUITI ACEASTA FOAIE CU DOVADA PREGATIRII PROFESIONALE (Diploma studii / Certificat calificare / Atestat profesional) - COPIE SEMNATA CONFORM CU ORIGINALUL");
            }

            // ==========================================
            // MODUL 2: DOSAR (ONRC, Declarații, Specimen)
            // ==========================================
            renderModuleCover("MODUL 2", "Formulare pentru Dosar (ONRC)");

            // --- 2.1 CERERE DE INREGISTRARE ---
            doc.addPage();
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("CERERE DE INREGISTRARE", 105, 20, null, null, "center");
            doc.setFont("helvetica", "normal");

            doc.setFontSize(11);
            doc.text(`CATRE: OFICIUL REGISTRULUI COMERTULUI DE PE LANGA TRIBUNALUL ${normalizeText(targetTribunal.toUpperCase())}`, 20, 35);

            let cerY = 50;
            doc.text("Subsemnatul/a, solicit inregistrarea in registrul comertului a entitatii:", 20, cerY);
            cerY += 10;

            renderFormField("Nume si Prenume:", nume, 20, cerY, 170);
            cerY += 10;
            renderFormField("CNP:", cnp, 20, cerY, 100);
            cerY += 10;
            renderFormField("Denumire Firma:", numeFirma, 20, cerY, 170);
            cerY += 15;

            doc.setFont("helvetica", "bold");
            doc.text("1. DATE PRIVIND SEDIUL SOCIAL:", 20, cerY);
            doc.setFont("helvetica", "normal");
            cerY += 8;
            renderFormField("Adresa Sediu:", sediu, 20, cerY, 170);
            cerY += 15;

            doc.setFont("helvetica", "bold");
            doc.text("2. CAPITAL SOCIAL (daca este cazul):", 20, cerY);
            doc.setFont("helvetica", "normal");
            cerY += 8;
            renderFormField("Suma totala (RON):", capital, 20, cerY, 80);
            cerY += 15;

            doc.setFont("helvetica", "bold");
            doc.text("3. TIP ENTITATE:", 20, cerY);
            doc.setFont("helvetica", "normal");
            cerY += 8;
            renderCheckbox("SRL", 30, cerY, entityType === 'SRL' || entityType === 'SRL-D');
            renderCheckbox("PFA", 80, cerY, entityType === 'PFA');
            cerY += 15;

            doc.setFont("helvetica", "bold");
            doc.text("4. OBIECT DE ACTIVITATE:", 20, cerY);
            doc.setFont("helvetica", "normal");
            cerY += 8;
            renderFormField("Domeniul principal:", caenStr, 20, cerY, 170);
            cerY += 20;

            doc.text("Solicit, de asemenea, eliberarea certificatului de inregistrare.", 20, cerY);
            cerY += 20;
            doc.text("Semnatura Solicitant, ___________________", 110, cerY);

            // --- 2.2 DECLARATIE PE PROPRIA RASPUNDERE ---
            doc.addPage();
            doc.setFontSize(16);
            doc.text("DECLARATIE", 105, 20, null, null, "center");

            currentY = 40;
            let declaratieTitlu = (entityType === 'SRL' || entityType === 'SRL-D') ? "ASOCIAT UNIC si ADMINISTRATOR" : "TITULAR PFA";
            let textDeclaratie;
            if (entityType === 'PFA') {
                textDeclaratie = `Subsemnatul/a ${normalizeText(nume)}, cetatean roman, nascut(a) la data de ${dataNasterii}, in ${normalizeText(locNastere)}, domiciliat(a) in ${normalizeText(adresaBuletin)}, identificat(a) cu C.I. seria ${ciSerie} nr. ${ciNumar}, eliberat(a) de ${normalizeText(ciEliberat)} la data de ${ciData}, C.N.P. ${cnp},

Cunoscand prevederile articolului 326 din Codul Penal privind falsul in declaratii, declar pe propria raspundere ca:
1. Indeplinesc conditiile legale pentru a desfasura activitate economica ca Persoana Fizica Autorizata, conform OUG nr. 44/2008.
2. Nu am antecedente penale si nu am fost condamnat pentru infractiuni prevazute de legislatia in vigoare.
3. Detin pregatirea profesionala necesara pentru desfasurarea activitatii: ${normalizeText(caenStr)}.
4. ${normalizeText(numeFirma)} va desfasura activitatile la sediul profesional / la terti, cu respectarea legislatiei privind protectia muncii, mediului si normelor sanitare.
5. La data inregistrarii nu detin calitatea de titular al altei PFA sau II inregistrate in Romania.`;
            } else {
                textDeclaratie = `Subsemnatul/a ${normalizeText(nume)}, cetatean roman, nascut(a) la data de ${dataNasterii}, in ${normalizeText(locNastere)}, domiciliat(a) in ${normalizeText(adresaBuletin)}, identificat(a) cu C.I. seria ${ciSerie} nr. ${ciNumar}, eliberat(a) de ${normalizeText(ciEliberat)} la data de ${ciData}, C.N.P. ${cnp},

Cunoscand prevederile articolului 326 din Codul Penal privind falsul in declaratii, declar pe propria raspundere ca:
1. Indeplinesc conditiile prevazute de lege pentru a detine si a exercita calitatea de ${declaratieTitlu} pentru entitatea ${normalizeText(numeFirma)}.
2. Nu am antecedente penale si nu am fost condamnat pentru gestiune frauduloasa, abuz de incredere, fals, uz de fals, inselaciune, delapidare, marturie mincinoasa, dare sau luare de mita.
3. Entitatea va desfasura activitatile inregistrate la sediul profesional / social, cu respectarea legislatiei privind protectia muncii, mediului si normelor sanitare.`;
            }

            currentY = addWrappedText(textDeclaratie, currentY);

            currentY = ensureSpace(currentY + 10, 40);
            doc.text("Semnatura,", 120, currentY);
            doc.text(normalizeText(`Nume Prenume: ${nume}`), 120, currentY + 10);
            doc.text("Semnatura: ___________________", 120, currentY + 20);
            doc.text(`Data: ${dataCurenta}`, 120, currentY + 30);

            // --- 2.3 DECLARATIE MODEL 3 ---
            doc.addPage();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("DECLARATIE MODEL 3", 105, 20, null, null, "center");
            doc.setFont("helvetica", "normal");

            let m3Y = 40;
            doc.setFontSize(11);
            doc.text("Subsemnatul/a, declarant pe proprie raspundere:", 20, m3Y);
            m3Y += 10;
            renderFormField("Nume si Prenume:", nume, 20, m3Y, 170);
            m3Y += 10;
            renderFormField("CNP:", cnp, 20, m3Y, 100);
            m3Y += 10;
            renderFormField("In calitate de administrator al:", numeFirma, 20, m3Y, 170);
            m3Y += 15;

            doc.text("Declar pe propria raspundere ca entitatea indeplineste conditiile de functionare pentru activitatile de mai jos, desfasurate la:", 20, m3Y);
            m3Y += 10;

            renderCheckbox("Sediul social situat in:", 30, m3Y, true);
            renderCheckbox("La terti (in afara sediului)", 100, m3Y, false);
            m3Y += 10;
            renderFormField("Adresa:", sediu, 20, m3Y, 170);
            m3Y += 15;

            doc.setFont("helvetica", "bold");
            doc.text("Coduri CAEN autorizate prin prezenta declaratie:", 20, m3Y);
            doc.setFont("helvetica", "normal");
            m3Y += 8;
            m3Y = addWrappedText(caenStr, m3Y, 10);

            m3Y += 15;
            doc.text("Prezenta declaratie este data in scopul autorizarii functionarii.", 20, m3Y);

            // Ensure ample space for signature at the bottom
            let sigM3Y = 250;
            doc.text("Semnatura Administrator,", 110, sigM3Y);
            doc.text("_________________________", 110, sigM3Y + 10);

            // --- 2.4 SPECIMEN DE SEMNATURA ---
            doc.addPage();
            doc.setFontSize(16);
            doc.text("SPECIMEN DE SEMNATURA", 105, 20, null, null, "center");

            currentY = 50;
            let adminTitle = entityType === 'PFA' ? "titular al entitatii" : "administrator al societatii";
            const textSpecimen = `Subsemnatul/a ${nume}, CNP ${cnp}, in calitate de ${adminTitle} ${numeFirma}, imi depun specimenul de semnatura in fata oficiului registrului comertului, dupa cum urmeaza:`;

            currentY = addWrappedText(textSpecimen, currentY);
            currentY = ensureSpace(currentY + 10, 50); // Box safety
            doc.rect(50, currentY + 10, 110, 40);

            // ==========================================
            // MODUL 3: ANEXE (Comodat, Vecini, Fiscal, CAEN, Separatoare)
            // ==========================================
            renderModuleCover("MODUL 3", "Anexe la Dosar (Sediul & Optionale)");

            // Inseram separatoarele solicitate
            renderSeparator("INLOCUITI ACEASTA FOAIE CU COPIA CI (Semnata Conform cu Originalul)");
            renderSeparator("INLOCUITI ACEASTA FOAIE CU DOVADA DEPUNERII CAPITALULUI SOCIAL (Chitanta de la Banca)");
            renderSeparator("INLOCUITI ACEASTA FOAIE CU DOVADA SEDIULUI (Contract Comodat / Extras CF)");

            // --- 3.1 CONTRACT DE COMODAT ---
            const comodantNume = localStorage.getItem('srl_comodant_nume') || '[NUME PROPRIETAR]';
            const comodantCI = localStorage.getItem('srl_comodant_ci') || '[SERIA/NR]';
            const comodantCNP = localStorage.getItem('srl_comodant_cnp') || '[CNP PROPRIETAR]';
            const docProprietate = localStorage.getItem('srl_document_proprietate') || '[DOCUMENT PROPRIETATE]';

            doc.addPage();
            doc.setFontSize(16);
            doc.text("CONTRACT DE COMODAT", 105, 20, null, null, "center");

            currentY = 40;
            const textComodat = `I. PARTILE CONTRACTANTE:
Comodant: ${comodantNume}, posesor al C.I. seria ${comodantCI}, CNP ${comodantCNP}, in calitate de proprietar al imobilului.
Comodatar: Societatea ${numeFirma}, in curs de infiintare, reprezentata prin ${nume}, in calitate de administrator.

II. OBIECTUL CONTRACTULUI:
Obiectul contractului il constituie darea in folosinta gratuita a imobilului (sau a unei camere din imobil) situat in ${sediu}, proprietatea comodantului conform ${docProprietate}.
Imobilul se va folosi de catre Comodatar cu destinatia de SEDIU SOCIAL.

III. DURATA:
Contractul se incheie pe o perioada de 10 ani, incepand cu data infiintarii firmei, cu posibilitate de prelungire.`;

            currentY = addWrappedText(textComodat, currentY);

            let comSigY = ensureSpace(currentY + 10, 40);
            doc.text(normalizeText("Semnatura COMODANT (Proprietar): ____________"), 20, comSigY);
            doc.text(normalizeText("Semnatura COMODATAR (Reprezentant Firma): ____________"), 20, comSigY + 15);
            doc.text(`Data: ${dataCurenta}`, 20, comSigY + 30);


            // --- 3.2 ACORD VECINI (If at bloc) ---
            if (localStorage.getItem('srl_sediu_bloc') === 'da') {
                doc.addPage();
                doc.setFontSize(16);
                doc.text(normalizeText("ACORDUL VECINILOR SI AL ASOCIATIEI DE PROPRIETARI"), 105, 20, null, null, "center");

                currentY = 40;
                const textVecini = `Privind stabilirea sediului social al "${numeFirma}"\n\nSubsemnata, Asociatia de Proprietari din ${sediu}, prin presedinte, impreuna cu proprietarii apartamentelor limitrofe, ne dam acordul pentru stabilirea sediului social al societatii ${numeFirma} la adresa mentionata mai sus.`;
                currentY = addWrappedText(textVecini, currentY);

                currentY = ensureSpace(currentY + 10, 80); // Rect + rows safety
                doc.rect(20, currentY + 10, 170, 60);
                doc.line(20, currentY + 25, 190, currentY + 25);
                doc.line(105, currentY + 10, 105, currentY + 70);

                doc.text("VECIN (SUS):", 25, currentY + 20);
                doc.text("VECIN (JOS):", 110, currentY + 20);
                doc.text("VECIN (STANGA):", 25, currentY + 40);
                doc.text("VECIN (DREAPTA):", 110, currentY + 40);

                doc.setFontSize(8);
                doc.text("Semnatura: _________________", 25, currentY + 33);
                doc.text("Semnatura: _________________", 110, currentY + 33);
                doc.text("Semnatura: _________________", 25, currentY + 63);
                doc.text("Semnatura: _________________", 110, currentY + 63);

                doc.setFontSize(11);
                doc.text(normalizeText("AVIZUL ASOCIATIEI DE PROPRIETARI (PRESEDINTE):"), 20, currentY + 85);
                doc.text("Semnatura si Stampila: _________________", 20, currentY + 100);
                doc.text(`Data: ${dataCurenta}`, 20, currentY + 115);
            }

            // --- 3.3 VECTOR FISCAL (ANEXA 1) ---
            doc.addPage();
            doc.setFontSize(16);
            doc.text("ANEXA 1 - VECTOR FISCAL", 105, 20, null, null, "center");

            currentY = 40;
            let textVector;
            if (entityType === 'PFA') {
                textVector = `Titular PFA: ${normalizeText(numeFirma)}
Optiuni fiscale declarate la constituire:

1. IMPOZITARE: Impozit pe venit - cota 10% aplicata la venitul net (sistem real sau norma de venit).
2. TVA: Neplatitor de TVA la constituire (inregistrare obligatorie la depasirea plafonului de 300.000 lei/an).
3. CAS: Contributia la pensii - 25% din venitul ales ca baza de calcul (obligatorie daca venitul net depaseste 48.600 lei/an).
4. CASS: Contributia la sanatate - 10% (obligatorie, plafon maxim 29.160 lei/an in 2026).
5. Declaratia Unica se depune pana pe 25 mai a anului urmator.`;
            } else {
                textVector = `Societatea: ${normalizeText(numeFirma)}
Optiuni fiscale declarate la constituire:

1. IMPOZITARE: Impozit pe veniturile microintreprinderilor (Cota 1% sau 3% conform legislatiei).
2. TVA: Neplatitor de TVA la constituire (cu optiune de inregistrare ulterioara la depasirea plafonului de 300.000 lei).
3. SALARIATI: Societatea va avea cel putin 1 salariat in termen de 30 de zile de la infiintare (conditie pentru microintreprindere).`;
            }

            currentY = addWrappedText(textVector, currentY);
            currentY = ensureSpace(currentY + 10, 30);
            let semnatarVector = entityType === 'PFA' ? "Semnatura Titular PFA, ___________________" : "Semnatura Administrator, ___________________";
            doc.text(semnatarVector, 110, currentY);

            // --- 3.4 CAEN LIST ADDITION ---
            doc.addPage();
            doc.setFontSize(16);
            doc.text("LISTA DE ACTIVITATI (CAEN)", 105, 20, null, null, "center");

            currentY = 40;
            let pfaNotice = entityType === 'PFA' ? "\nNOTA IMPORTANTA PENTRU PFA: Va reamintim ca pentru includerea oricarui cod CAEN la PFA trebuie sa depuneti o diploma de studii, certificat de calificare sau adeverinta de experienta in domeniul respectiv!\n" : "";

            const textCaenList = `Domeniul principal inregistrat:
${caenStr}
${pfaNotice}
Coduri CAEN Secundare Sugerate (exemple populare, le poti selecta pe portalul ONRC in functie de specificul exact):

IT & SOFTWARE:
• 6201 - Activitati de realizare a soft-ului la comanda (software orientat client)
• 6202 - Activitati de consultanta in tehnologia informatiei
• 6209 - Alte activitati de servicii privind tehnologia informatiei
• 6311 - Prelucrarea datelor, administrarea paginilor web si activitati conexe
• 6312 - Activitati ale portalurilor web

COMERT ONLINE:
• 4791 - Comert cu amanuntul prin intermediul caselor de comenzi sau prin Internet
• 4619 - Intermedieri in comertul cu produse diverse
• 7311 - Activitati ale agentiilor de publicitate (utile pt. marketing)

SERVICII & CONSULTANTA:
• 7022 - Activitati de consultanta pentru afaceri si management
• 7490 - Alte activitati profesionale, stiintifice si tehnice n.c.a.
• 8211 - Activitati combinate de secretariat
• 8299 - Alte activitati de servicii suport pentru intreprinderi n.c.a.
`;
            currentY = addWrappedText(textCaenList, currentY, 11);
            // Reset color before passing to next notes
            doc.setTextColor(0, 0, 0);

            // === PAGINA FINALA - DEPUNEREA DOSARULUI & NOTE ADMINISTRATIVE ===
            doc.addPage();
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // Dark blue/slate
            doc.text("DEPUNEREA DOSARULUI", 105, 30, null, null, "center");

            let depY = 45;
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text(normalizeText("Dupa semnare, dosarul poate fi depus:"), 20, depY);

            // Bullet Online
            depY += 15;
            doc.setFont("helvetica", "bold");
            doc.text(normalizeText("• Online: "), 25, depY);
            doc.setFont("helvetica", "normal");
            let txtOnline = normalizeText("Pe noul portal al Registrului Comertului (https://portal.onrc.ro) – Necesita semnatura electronica calificata.");
            let formattedOnline = doc.splitTextToSize(txtOnline, 130);
            doc.text(formattedOnline, 50, depY);

            // Sfat
            depY += 18;
            doc.setFont("helvetica", "bold");
            doc.text("Sfat: ", 25, depY);
            doc.setFont("helvetica", "normal");
            doc.text(normalizeText("Daca alegi depunerea online, poti beneficia de o reducere la taxele de inmatriculare."), 40, depY);

            // Bullet Ghiseu
            depY += 20;
            doc.setFont("helvetica", "bold");
            doc.text(normalizeText("• Direct la ghiseu: "), 25, depY);
            doc.setFont("helvetica", "normal");
            let txtGhiseu = normalizeText("La sediul Oficiului National al Registrului Comertului (ONRC) din judetul unde ai stabilit sediul social.");
            let formattedGhiseu = doc.splitTextToSize(txtGhiseu, 130);
            doc.text(formattedGhiseu, 65, depY);

            // === INFORMATII DE CONTACT & SEDII ===
            depY += 20;
            doc.setDrawColor(220, 226, 230);
            doc.line(25, depY, 185, depY);

            depY += 10;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Puncte de referinta pentru sediile ONRC principale:", 25, depY);

            depY += 10;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const sediiList = [
                "Bucuresti: Bd. Octavian Goga nr. 2, Tronson II, Sec. 3",
                "Cluj: Str. Slatina nr. 2-4, Cluj-Napoca",
                "Timis: Str. Paris nr. 2A, Timisoara",
                "Iasi: Str. Vasile Lupu nr. 5A, Iasi"
            ];
            sediiList.forEach(sediuItem => {
                doc.text(`- ${normalizeText(sediuItem)}`, 30, depY);
                depY += 6;
            });

            depY += 5;
            doc.setFont("helvetica", "bold");
            doc.text("Pentru restul judetelor:", 25, depY);
            doc.setFont("helvetica", "normal");
            doc.text("Verifica adresa exacta la: https://www.onrc.ro/index.php/ro/contact", 73, depY);

            // === PROGRAM & ASISTENTA ===
            depY += 15;
            doc.setFont("helvetica", "bold");
            doc.text("Program de lucru standard la ghiseu:", 25, depY);
            doc.setFont("helvetica", "normal");
            doc.text("Luni - Joi (08:00 - 16:30), Vineri (08:00 - 14:00).", 30, depY + 6);

            doc.setFont("helvetica", "bold");
            doc.text("Contact suport (Asistenta Generala ONRC):", 25, depY + 16);
            doc.setFont("helvetica", "normal");
            doc.text("E-mail: onrc@onrc.ro (Raspuns in 1-3 zile lucratoare)", 30, depY + 22);

            // NOTE ADMINISTRATIVE
            let noteY = ensureSpace(depY + 15, 60);
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(248, 250, 252);
            doc.rect(20, noteY, 170, 45, 'FD'); // Filled and outline

            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.text("NOTE ADMINISTRATIVE:", 25, noteY + 8);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);
            const textNote = normalizeText("La depunerea acestui dosar pe portalul ONRC, institutia va percepe automat o taxa de publicare in Monitorul Oficial. Aceasta taxa are o valoare aproximativa de 72 - 120 RON si se achita exclusiv online (cu cardul) pe portalul oficial al Registrului Comertului, la finalizarea cererii de inregistrare.");
            const linesNote = doc.splitTextToSize(textNote, 160);
            doc.text(linesNote, 25, noteY + 16);

            // Save cu nume corect (Sistem BLOB pentru Compatibilitate Mobile Safari/Android)
            const fileName = normalizeText(`Dosar_Complet_${entityType}_${numeFirma.replace(/\s+/g, '_')}.pdf`);

            // Generate Blob URL
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);

            // Create temporary invisible link
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;

            // Trigger click
            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            console.log(`Fisier descărcat cu succes prin rutină Blob: ${fileName}`);

        } catch (error) {
            console.error("Eroare severa PDF: ", error);
            alert("S-a generat o eroare. Funcționalitatea a întâmpinat o problemă: " + error.message);
        }
    };

    window.generateAllPDFs = function () {
        // Genereaza secvential cele 3 PDF-uri apelând funcția de bază cu override de tip
        setTimeout(() => window.generateAndDownloadPDF('SRL'), 500);
        setTimeout(() => window.generateAndDownloadPDF('SRL-D'), 1500);
        setTimeout(() => window.generateAndDownloadPDF('PFA'), 2500);
    };

    // ============================================================
    // COURIER DELIVERY OPTION
    // ============================================================
    window.toggleCourierAddress = function () {
        const checked = document.getElementById('want-courier').checked;
        const box = document.getElementById('courier-address-box');
        box.style.display = checked ? 'block' : 'none';
        localStorage.setItem('srl_want_courier', checked ? 'da' : 'nu');
    };

    // ============================================================
    // CHATBOT
    // ============================================================
    const FAQ = [
        {
            keywords: ['curier', 'fizic', 'acasă', 'acasa', 'livra', 'trimit', 'transport', 'pret transport', 'cat costa transportul', 'tarif', 'cat costa livrarea', 'pfa'],
            answer: '🚚 Da! Putem trimite dosarul fizic (SRL sau PFA) prin <strong>Fan Courier</strong> sau <strong>Sameday</strong>.\n\n💶 <strong>Tarife estimate:</strong>\n• București: ~15-18 RON\n• Alte localități: ~20-25 RON\n\nPlata transportului se face direct la curier (ramburs). Vrei să programăm o livrare? Scrie-ne pe <strong><a href="https://wa.me/40733874143" target="_blank">WhatsApp</a></strong>.'
        },
        {
            keywords: ['cost', 'cât costă', 'pret', 'preț', 'cât', 'bani', 'ron', 'pachet', 'pachete', 'pfa'],
            answer: '💰 **Prețuri Clare:**\n• **PFA Digital**: 99 RON (descărcare instant).\n• **PFA Complet**: 199 RON + Transport curier: ~20 RON (plată la livrare).\n• **SRL Digital**: 149 RON (descărcare instant).\n• **SRL Complet**: 299 RON + Transport curier: ~20 RON (plată la livrare).\n\nDocumente generate instant! Verificate de expert.'
        },
        {
            keywords: ['dureaz', 'timp', 'zile', 'rapid', 'repede', 'când', 'cand'],
            answer: '⏱ Procesul complet durează <strong>5–10 zile lucrătoare</strong> de la depunerea dosarului la ONRC. Noi pregătim documentele tale în <strong>câteva ore</strong> după plată!\n\nVrei să grăbim procesul? Hai pe <strong><a href="https://wa.me/40733874143" target="_blank">WhatsApp</a></strong>.'
        },
        {
            keywords: ['acte', 'documente', 'dosar', 'ce trebuie', 'necesare', 'vecini', 'asociație', 'asociatie', 'bloc', 'apartament'],
            answer: '📄 Dosarul conține acte specifice (SRL sau PFA). Dacă sediul este la bloc, adăugăm automat și **Formularul pentru Acordul Vecinilor și al Asociației de Proprietari**!\n\nAi nevoie de ajutor cu actele? Click aici: <strong><a href="https://wa.me/40733874143" target="_blank">WhatsApp</a></strong>.'
        },
        {
            keywords: ['srl-d', 'debutant', 'sub 35', 'tânăr', 'tanar'],
            answer: '❓ <strong>SRL-D (Debutant)</strong> este o formă specială pentru persoane sub 35 de ani, la prima afacere. Avantaje: scutire de la plata contribuțiilor sociale timp de 4 ani. Condiție: nu ai mai deținut o firmă înainte.'
        },
        {
            keywords: ['caen', 'activitate', 'cod', 'domeniu'],
            answer: '🏭 Codul CAEN reprezintă domeniul principal de activitate al firmei (ex: 6201 – Activități de realizare a soft-ului). La Pachetul Complet îți oferim consultanță gratuită pentru alegerea codurilor CAEN potrivite!'
        },
        {
            keywords: ['capital', 'social', 'minim', 'cât capital'],
            answer: '💳 Capitalul social minim pentru un SRL este de <strong>1 leu</strong> (în practică se folosesc 200 lei). PFA nu are capital social.'
        },
        {
            keywords: ['sediu', 'adresă', 'adresa', 'domiciliu', 'birou'],
            answer: '🏠 Sediul social poate fi la domiciliul tău (din buletin) sau la o altă adresă cu contract de comodat/închiriere. Poți folosi și un serviciu de sediu virtual (~50-150 RON/lună).'
        },
        {
            keywords: ['salut', 'buna', 'bună', 'hello', 'hey', 'hei'],
            answer: '👋 Bună ziua! Sunt <strong>StartBot</strong>, asistentul tău pentru înființare SRL sau PFA.\n\nCum te pot ajuta? Dacă vrei să vorbim direct, scrie-ne pe <strong><a href="https://wa.me/40733874143" target="_blank">WhatsApp</a></strong>.'
        }
    ];

    let chatOpen = false;

    window.toggleChat = function () {
        chatOpen = !chatOpen;
        const win = document.getElementById('chatbot-window');
        const iconOpen = document.getElementById('chat-icon-open');
        const iconClose = document.getElementById('chat-icon-close');
        const notif = document.getElementById('chat-notif');

        win.style.display = chatOpen ? 'flex' : 'none';
        iconOpen.style.display = chatOpen ? 'none' : 'inline';
        iconClose.style.display = chatOpen ? 'inline' : 'none';
        if (notif) notif.style.display = 'none';

        if (chatOpen) {
            setTimeout(() => {
                const input = document.getElementById('chat-input');
                if (input) input.focus();
            }, 300);
        }
    };

    window.sendQuickReply = function (text) {
        appendMessage(text, 'user');
        const suggestions = document.querySelector('.chatbot-suggestions');
        if (suggestions) suggestions.style.display = 'none';
        setTimeout(() => botReply(text), 600);
    };

    window.sendChatMessage = function () {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        appendMessage(text, 'user');
        setTimeout(() => botReply(text), 700);
    };

    function appendMessage(text, sender) {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = `chat-msg ${sender}`;
        div.innerHTML = `<div class="chat-bubble">${text}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function botReply(userText) {
        const lower = userText.toLowerCase();
        let answer = '🤔 Nu am înțeles exact. Încearcă să întrebi despre costuri, acte sau curier.\n\nSau vorbește direct cu un consultant pe <strong><a href="https://wa.me/40733874143" target="_blank">WhatsApp</a></strong>.';

        for (const faq of FAQ) {
            if (faq.keywords.some(kw => lower.includes(kw))) {
                answer = faq.answer;
                break;
            }
        }

        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        div.innerHTML = `<div class="chat-bubble">${answer.replace(/\n/g, '<br>')}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;

        // Ascunde suggestions si arata buton inapoi
        const suggestions = document.getElementById('chat-suggestions');
        if (suggestions) suggestions.style.display = 'none';

        // Adauga buton inapoi daca nu exista deja
        if (!document.getElementById('chat-back-btn')) {
            const backBtn = document.createElement('button');
            backBtn.id = 'chat-back-btn';
            backBtn.className = 'chat-back-btn';
            backBtn.innerHTML = '<i class="ri-arrow-left-line"></i> Înapoi la meniu';
            backBtn.onclick = function () {
                if (suggestions) suggestions.style.display = 'flex';
                backBtn.remove();
            };
            const inputRow = document.querySelector('.chatbot-input-row');
            if (inputRow) inputRow.parentNode.insertBefore(backBtn, inputRow);
        }
    }

});