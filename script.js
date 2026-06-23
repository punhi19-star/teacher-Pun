/* ==========================================================================
   Cosmic Script: ท่องแดนดาราศาสตร์ (Astronomy CAI Grade 4)
   Logic: Navigation, Audio Synth, Orbit Simulation, Sorting Game, Tide Canvas, Quiz
   ========================================================================== */

// --- 1. WEB AUDIO SYNTHESIZER ---
class AudioSynth {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playTone(freq, type, duration, volume) {
        if (!this.enabled) return;
        this.init();
        
        try {
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            
            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio Context error:", e);
        }
    }

    playClick() {
        this.playTone(800, 'sine', 0.1, 0.15);
    }

    playHover() {
        this.playTone(1200, 'sine', 0.05, 0.05);
    }

    playCorrect() {
        this.playTone(523.25, 'sine', 0.15, 0.15); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.15), 100); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.3, 0.2), 200); // G5
    }

    playIncorrect() {
        this.playTone(220, 'triangle', 0.3, 0.3); // A3
        setTimeout(() => this.playTone(180, 'triangle', 0.4, 0.3), 150);
    }

    playSuccess() {
        // Starry Arpeggio
        const tones = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
        tones.forEach((tone, idx) => {
            setTimeout(() => this.playTone(tone, 'sine', 0.2, 0.15), idx * 80);
        });
    }
}

const synth = new AudioSynth();

// --- 2. VIEW ROUTER ---
function switchView(viewId) {
    synth.playClick();
    
    // Deactivate all sections & buttons
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Activate target
    const targetSection = document.getElementById(viewId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const targetButton = document.querySelector(`.nav-btn[data-target="${viewId}"]`);
    if (targetButton) {
        targetButton.classList.add('active');
    }

    // Scroll to top of viewport
    window.scrollTo(0, 0);

    // Specific setups when arriving on views
    if (viewId === 'tides-view') {
        startTideSimulation();
    } else {
        stopTideSimulation();
    }

    if (viewId === 'game-view') {
        initGame();
    }

    if (viewId === 'leaderboard-view') {
        renderLeaderboard();
    }
}

// Attach Nav Clicks
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-target');
        switchView(target);
    });
});

// Sound Toggle Button
const soundToggleBtn = document.getElementById('sound-toggle-btn');
soundToggleBtn.addEventListener('click', () => {
    const enabled = synth.toggle();
    if (enabled) {
        soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        soundToggleBtn.style.color = 'var(--neon-blue)';
        synth.playClick();
    } else {
        soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        soundToggleBtn.style.color = 'var(--text-muted)';
    }
});


// --- 3. CELESTIAL INFO DATABASE ---
const celestialDB = {
    sun: {
        nameTh: "ดวงอาทิตย์",
        nameEn: "The Sun",
        type: "ดาวฤกษ์ (ศูนย์กลาง)",
        typeClass: "wonder",
        illustrationClass: "sun-preview",
        description: "ดวงอาทิตย์เป็นดาวฤกษ์สีเหลืองขนาดใหญ่ที่เป็นศูนย์กลางของระบบสุริยะ และเป็นแหล่งพลังงานแสงและพลังงานความร้อนที่สำคัญที่สุดแก่โลกของเรา ดวงอาทิตย์เป็นดาวเพียงดวงเดียวในระบบที่มีแสงสว่างและความร้อนในตัวเอง เปรียบเสมือนดวงไฟยักษ์กลางจักรวาลที่ช่วยค้ำจุนชีวิตของดาวเคราะห์บริวารทุกดวงที่โคจรรอบตัวมัน",
        orbit: "ศูนย์กลางระบบสุริยะ (ไม่ได้หมุนรอบดาวอื่น)",
        moons: "บริวารหลัก 8 ดวง",
        highlight: "ให้พลังงานแสง ความร้อน และมีแรงโน้มถ่วงมหาศาลในการดึงดูดดาวเคราะห์ทั้งหมดให้หมุนรอบตัวมัน"
    },
    mercury: {
        nameTh: "ดาวพุธ",
        nameEn: "Mercury",
        type: "ดาวเคราะห์หิน (Terrestrial)",
        typeClass: "terrestrial",
        illustrationClass: "mercury-preview",
        description: "ดาวพุธเป็นดาวเคราะห์ที่อยู่ใกล้ดวงอาทิตย์ที่สุด มีขนาดเล็กมาก ไม่มีดวงจันทร์บริวารและไม่มีชั้นบรรยากาศคอยกรองความร้อน ทำให้อุณหภูมิพื้นผิวต่างกันสุดขั้ว ด้านที่หันหาดวงอาทิตย์จะร้อนจัดจนละลายเหล็กได้ ส่วนด้านตรงข้ามจะหนาวเย็นติดลบ จึงได้ฉายาว่า 'เตาไฟแช่แข็ง' พื้นผิวเต็มไปด้วยหลุมบ่อคล้ายดวงจันทร์",
        orbit: "ประมาณ 88 วันบนโลก (โคจรเร็วที่สุด)",
        moons: "ไม่มีบริวาร",
        highlight: "อยู่ใกล้ดวงอาทิตย์ที่สุด และได้ฉายาว่า เตาไฟแช่แข็ง"
    },
    venus: {
        nameTh: "ดาวศุกร์",
        nameEn: "Venus",
        type: "ดาวเคราะห์หิน (Terrestrial)",
        typeClass: "terrestrial",
        illustrationClass: "venus-preview",
        description: "ดาวศุกร์เป็นดาวเคราะห์ลำดับที่สอง มีขนาดและโครงสร้างใกล้เคียงกับโลกมาก จนได้รับการขนานนามว่า 'ฝาแฝดของโลก' ดาวศุกร์มีชั้นบรรยากาศหนาทึบไปด้วยแก๊สคาร์บอนไดออกไซด์และไอของกรดกำมะถัน ซึ่งกักเก็บความร้อนไว้หนาแน่นเกิดปรากฏการณ์เรือนกระจกขั้นรุนแรง ส่งผลให้เป็นดาวเคราะห์ที่ร้อนที่สุดในระบบสุริยะ (ร้อนกว่าดาวพุธเสียอีก) เรามองเห็นดาวศุกร์สว่างมากในเวลาเย็น (ดาวประจำเมือง) หรือเช้ามืด (ดาวประกายพรึก)",
        orbit: "ประมาณ 225 วันบนโลก",
        moons: "ไม่มีบริวาร",
        highlight: "ร้อนที่สุดในระบบสุริยะ และสว่างโดดเด่นบนท้องฟ้า"
    },
    earth: {
        nameTh: "โลก",
        nameEn: "Earth",
        type: "ดาวเคราะห์หิน (Terrestrial)",
        typeClass: "terrestrial",
        illustrationClass: "earth-preview",
        description: "โลกเป็นดาวเคราะห์ดวงที่สาม และเป็นดาวดวงเดียวในจักรวาลที่ได้รับการยืนยันว่ามีสิ่งมีชีวิตอาศัยอยู่ พื้นผิวโลกมากกว่า 70% ปกคลุมด้วยมหาสมุทรน้ำแข็งและน้ำเหลว จึงได้ชื่อว่า 'ดาวเคราะห์สีน้ำเงิน' โลกมีชั้นบรรยากาศที่เหมาะสม มีแก๊สออกซิเจนให้พวกเราหายใจ มีสนามแม่เหล็กช่วยป้องกันรังสีอันตรายจากดวกอาทิตย์ และมีดวงจันทร์เป็นบริวารคอยส่งแรงดึงดูดทำให้น้ำขึ้นน้ำลง",
        orbit: "365.25 วัน (1 ปี)",
        moons: "1 ดวง (ดวงจันทร์ของเรา)",
        highlight: "มีน้ำ ของเหลว และสิ่งมีชีวิตอาศัยอยู่เพียงดวงเดียวที่ค้นพบ"
    },
    mars: {
        nameTh: "ดาวอังคาร",
        nameEn: "Mars",
        type: "ดาวเคราะห์หิน (Terrestrial)",
        typeClass: "terrestrial",
        illustrationClass: "mars-preview",
        description: "ดาวอังคาร หรือดาวเคราะห์สีแดง เนื่องจากมีหินและฝุ่นผงที่อุดมไปด้วยแร่เหล็ก (สนิมเหล็ก) ปกคลุมทั่วพื้นผิว มีขนาดประมาณครึ่งหนึ่งของโลก มีสภาพอากาศแห้งแล้งและหนาวเย็น มีร่องรอยของธารน้ำโบราณที่เหือดแห้งไปแล้ว และมีภูเขาไฟที่ใหญ่ที่สุดในระบบสุริยะ ชื่อว่า 'ภูเขาไฟโอลิมปัส' ปัจจุบันมนุษย์ส่งหุ่นยนต์หลายตัวไปสแกนหาเบาะแสสิ่งมีชีวิตและเตรียมการส่งมนุษย์ไปสำรวจ",
        orbit: "ประมาณ 687 วันบนโลก (เกือบ 2 เท่าของโลก)",
        moons: "2 ดวง (โฟบอส และ ดีมอส ขนาดเล็กมาก)",
        highlight: "พื้นผิวสีแดงจากสนิมเหล็ก และมีภูเขาไฟที่สูงที่สุดในระบบสุริยะ"
    },
    jupiter: {
        nameTh: "ดาวพฤหัสบดี",
        nameEn: "Jupiter",
        type: "ดาวเคราะห์แก๊ส (Gas Giant)",
        typeClass: "gas",
        illustrationClass: "jupiter-preview",
        description: "ดาวพฤหัสบดีเป็นพี่ใหญ่ที่ใหญ่ที่สุดในระบบสุริยะ มีขนาดกว้างใหญ่จนสามารถบรรจุโลกเข้าไปข้างในได้มากกว่า 1,300 ดวง! ดาวดวงนี้ไม่มีพื้นผิวแข็งเป็นหิน แต่มีส่วนประกอบหลักเป็นแก๊สไฮโดรเจนและฮีเลียมหนาแน่น ลักษณะเด่นคือมีลวดลายพายุพาดขวางรอบตัวดาว และมีพายุหมุนขนาดยักษ์สีส้มแดงที่เรียกว่า 'จุดแดงใหญ่' (Great Red Spot) ซึ่งพัดกระหน่ำมานานหลายร้อยปี",
        orbit: "ประมาณ 12 ปีบนโลก",
        moons: "มากกว่า 80 ดวง (เช่น ไอโอ, ยูโรปา, แกนีมีด)",
        highlight: "ขนาดใหญ่ที่สุดในระบบสุริยะ และมีพายุหมุนจุดแดงใหญ่"
    },
    saturn: {
        nameTh: "ดาวเสาร์",
        nameEn: "Saturn",
        type: "ดาวเคราะห์แก๊ส (Gas Giant)",
        typeClass: "gas",
        illustrationClass: "saturn-preview",
        description: "ดาวเสาร์เป็นดาวเคราะห์ดวงที่หก และขึ้นชื่อเรื่องความสวยงามอลังการของวงแหวนล้อมรอบ วงแหวนของดาวเสาร์ประกอบไปด้วยน้ำแข็ง ฝุ่น และเศษหินอวกาศจำนวนนับไม่ถ้วนที่สะท้อนแสงอาทิตย์ได้ดีมาก ตัวดาวเสาร์เป็นดาวแก๊สขนาดยักษ์ที่มีความหนาแน่นต่ำมาก ต่ำยิ่งกว่าน้ำเสียอีก! หมายความว่าถ้าหากเรามีอ่างน้ำที่ใหญ่พอ ดาวเสาร์จะสามารถลอยน้ำได้อย่างน่าอัศจรรย์",
        orbit: "ประมาณ 29 ปีบนโลก",
        moons: "มากกว่า 80 ดวง (ไททัน เป็นดวงจันทร์ที่ใหญ่ที่สุด)",
        highlight: "ระบบวงแหวนน้ำแข็งที่ชัดเจนสวยงาม และมีความหนาแน่นต่ำกว่าน้ำ"
    },
    uranus: {
        nameTh: "ดาวยูเรนัส",
        nameEn: "Uranus",
        type: "ดาวเคราะห์แก๊ส (Gas Giant)",
        typeClass: "gas",
        illustrationClass: "uranus-preview",
        description: "ดาวยูเรนัส หรือดาวมฤตยู เป็นดาวเคราะห์แก๊สขนาดใหญ่ที่มีก๊าซมีเทนในบรรยากาศคอยดูดกลืนแสงสีแดงและสะท้อนสีฟ้าอมเขียวออกมา ทำให้ดูเป็นสีพาสเทลสวยงาม สิ่งที่แปลกประหลาดที่สุดของดาวยูเรนัสคือแกนหมุนของมันเอียงเกือบ 98 องศา ทำให้หมุนตะแคงข้างคล้ายลูกบอลที่นอนกลิ้งไปตามวงโคจรรอบดวงอาทิตย์ ดาวยูเรนัสมีวงแหวนมืดๆ ล้อมรอบและหนาวเย็นจัด",
        orbit: "ประมาณ 84 ปีบนโลก",
        moons: "27 ดวงที่รู้จัก",
        highlight: "หมุนตะแคงข้าง และมีสีฟ้าอมเขียวพาสเทลจากแก๊สมีเทน"
    },
    neptune: {
        nameTh: "ดาวเนปจูน",
        nameEn: "Neptune",
        type: "ดาวเคราะห์แก๊ส (Gas Giant)",
        typeClass: "gas",
        illustrationClass: "neptune-preview",
        description: "ดาวเนปจูน หรือดาวเกตุ เป็นดาวเคราะห์ที่อยู่ไกลที่สุดจากดวงอาทิตย์ มีสีน้ำเงินเข้มสะดุดตา โครงสร้างคล้ายดาวยูเรนัส ดาวเนปจูนเป็นดวงดาวที่หนาวเย็นสุดขั้วและมีสภาพอากาศแปรปรวนรุนแรง มีพายุหมุนความเร็วสูงสุดในระบบสุริยะ พัดเร็วถึง 2,100 กิโลเมตรต่อชั่วโมง! ดาวเนปจูนมีจุดมืดใหญ่ที่เป็นพายุหมุนรุนแรง และมีดวงจันทร์ชื่อทริตันที่โคจรสวนทางกับดาวแม่",
        orbit: "ประมาณ 165 ปีบนโลก (ยาวนานที่สุด)",
        moons: "14 ดวงที่รู้จัก",
        highlight: "อยู่ไกลสุด หนาวจัด และมีพายุพัดเร็วแรงที่สุดในระบบสุริยะ"
    },
    pluto: {
        nameTh: "ดาวเคราะห์แคระพลูโต",
        nameEn: "Dwarf Planet Pluto",
        type: "ดาวเคราะห์แคระ (Dwarf Planet)",
        typeClass: "wonder",
        illustrationClass: "pluto-preview",
        description: "พลูโตเคยถูกนับเป็นดาวเคราะห์ดวงที่ 9 ของระบบสุริยะตั้งแต่ปี พ.ศ. 2473 แต่ในปี พ.ศ. 2449 สมาพันธ์ดาราศาสตร์สากลได้ปรับลดสถานะลงมาเป็น 'ดาวเคราะห์แคระ' เนื่องจากพลูโตมีขนาดเล็กมาก เล็กกว่าดวงจันทร์ของโลกเราเสียอีก และมีเส้นทางวงโคจรที่เป็นวงรีทับซ้อนกับดาวเนปจูน ไม่สามารถเคลียร์วัตถุในวงโคจรของตัวเองได้ ปัจจุบันพลูโตล่องลอยอยู่ในแถบไคเปอร์ขอบนอกของระบบสุริยะ",
        orbit: "ประมาณ 248 ปีบนโลก",
        moons: "5 ดวงบริวาร",
        highlight: "ดาวเคราะห์แคระที่เคยเป็นดาวเคราะห์ดวงที่ 9 ก่อนโดนลดสถานะเนื่องจากขนาดเล็ก"
    },
    asteroids: {
        nameTh: "แถบดาวเคราะห์น้อย",
        nameEn: "Asteroid Belt",
        type: "วัตถุอวกาศ / หินฝุ่น",
        typeClass: "wonder",
        illustrationClass: "asteroids-preview",
        description: "แถบดาวเคราะห์น้อยเป็นบริเวณกว้างใหญ่ที่ล่องลอยอยู่ระหว่างวงโคจรของดาวอังคารและดาวพฤหัสบดี ประกอบไปด้วยวัตถุที่เป็นหินและแร่ธาตุขนาดต่างๆ กัน ตั้งแต่เม็ดฝุ่นไปจนถึงวัตถุขนาดใหญ่หลายร้อยกิโลเมตร นักวิทยาศาสตร์เชื่อว่าเศษหินเหล่านี้คือเศษซากที่หลงเหลือจากการก่อตัวของระบบสุริยะเมื่อ 4,600 ล้านปีก่อนที่ไม่สามารถรวมตัวกันเป็นดาวเคราะห์ได้เนื่องจากโดนแรงดึงดูดมหาศาลจากดาวพฤหัสบดีรบกวน",
        orbit: "ลอยอยู่ระหว่างดาวอังคารและดาวพฤหัสบดี",
        moons: "ไม่มี (แต่วัตถุบางชิ้นมีหินก้อนเล็กโคจรรอบตัวเอง)",
        highlight: "กำแพงก้อนหินอวกาศล้านก้อน กั้นระหว่างกลุ่มดาวเคราะห์หินและแก๊ส"
    },
    comet: {
        nameTh: "ดาวหาง (นักเดินทางน้ำแข็ง)",
        nameEn: "Comet",
        type: "วัตถุขอบระบบสุริยะ",
        typeClass: "wonder",
        illustrationClass: "comet-preview",
        description: "ดาวหางเปรียบเสมือนก้อนหิมะสกปรกหรือนักเดินทางน้ำแข็งจากขอบระบบสุริยะ ประกอบด้วยน้ำแข็ง ฝุ่นละออง ก้อนหิน และแก๊สแช่แข็ง เมื่อล่องลอยห่างไกลดวงอาทิตย์จะไม่มีแสงสว่างในตัวเอง แต่เมื่อมันโคจรเข้ามาใกล้ดวงอาทิตย์ พลังงานความร้อนจะทำให้แก๊สและน้ำแข็งเกิดการระเหิดกลายเป็นกลุ่มควันฟุ้งกระจาย และถูกลมสุริยะพัดเป่าจนเกิดเป็นหางยาวสว่างไสวชี้ไปทางทิศตรงกันข้ามกับดวงอาทิตย์เสมอ",
        orbit: "โคจรเป็นวงรีรีมากจากขอบนอกของระบบสุริยะ",
        moons: "ไม่มี",
        highlight: "เป็นก้อนน้ำแข็งอวกาศที่มีหางยาวสวยงามเมื่อเข้าใกล้ดวงอาทิตย์"
    }
};

// --- 4. ORBIT SIMULATOR CONTROLLER ---
const orbitData = {
    mercury: { radius: 50, speed: 0.04, angle: 0 },
    venus:   { radius: 70, speed: 0.03, angle: 0 },
    earth:   { radius: 95, speed: 0.02, angle: 0 },
    mars:    { radius: 120, speed: 0.015, angle: 0 },
    jupiter: { radius: 165, speed: 0.008, angle: 0 },
    saturn:  { radius: 205, speed: 0.006, angle: 0 },
    uranus:  { radius: 235, speed: 0.004, angle: 0 },
    neptune: { radius: 265, speed: 0.003, angle: 0 }
};

let orbitPaused = false;
let orbitSpeedMultiplier = 5;
let animationFrameId = null;

function animateOrbits() {
    if (!orbitPaused) {
        // Loop planets and update angles
        Object.keys(orbitData).forEach(planetId => {
            const planet = orbitData[planetId];
            // Update angle based on speed slider
            planet.angle += planet.speed * (orbitSpeedMultiplier * 0.2);
            
            // Calculate XY offset
            const x = planet.radius * Math.cos(planet.angle);
            const y = planet.radius * Math.sin(planet.angle);
            
            // Apply CSS transform
            const element = document.getElementById(planetId);
            if (element) {
                element.style.transform = `translate(${x}px, ${y}px)`;
            }
        });
    }
    animationFrameId = requestAnimationFrame(animateOrbits);
}

// Controls handlers
const btnPauseOrbit = document.getElementById('btn-pause-orbit');
btnPauseOrbit.addEventListener('click', () => {
    synth.playClick();
    orbitPaused = !orbitPaused;
    if (orbitPaused) {
        btnPauseOrbit.innerHTML = '<i class="fa-solid fa-play"></i>';
        btnPauseOrbit.title = "เล่นวงโคจร";
    } else {
        btnPauseOrbit.innerHTML = '<i class="fa-solid fa-pause"></i>';
        btnPauseOrbit.title = "หยุดวงโคจร";
    }
});

const orbitSpeedSlider = document.getElementById('orbit-speed');
orbitSpeedSlider.addEventListener('input', (e) => {
    orbitSpeedMultiplier = parseInt(e.target.value);
});

// Planet clicking events to open scanner
const defaultInfoPrompt = document.getElementById('default-info-prompt');
const planetInfoCard = document.getElementById('planet-info-card');

function selectBody(bodyId) {
    synth.playClick();
    const data = celestialDB[bodyId];
    if (!data) return;

    // Set Text Values
    document.getElementById('card-name-th').innerText = data.nameTh;
    document.getElementById('card-name-en').innerText = data.nameEn;
    document.getElementById('card-description').innerText = data.description;
    document.getElementById('stat-orbit').innerText = data.orbit;
    document.getElementById('stat-moons').innerText = data.moons;
    document.getElementById('stat-highlight').innerText = data.highlight;
    
    // Set Badge Category
    const badge = document.getElementById('card-type-badge');
    badge.innerText = data.type;
    badge.className = `type-badge ${data.typeClass}`;
    
    // Set Illustration
    const illBox = document.getElementById('card-illustration');
    illBox.className = `card-illustration ${data.illustrationClass}`;
    
    // For custom wonder previews that need extra styling
    illBox.innerHTML = '';
    if (bodyId === 'asteroids') {
        illBox.innerHTML = '<i class="fa-solid fa-meteor text-neon-orange" style="font-size:32px"></i><i class="fa-solid fa-meteor text-neon-orange" style="font-size:20px;opacity:0.6"></i><i class="fa-solid fa-meteor text-neon-orange" style="font-size:24px;opacity:0.8"></i>';
    } else if (bodyId === 'comet') {
        illBox.innerHTML = '<div style="position:relative"><i class="fa-solid fa-meteor text-neon-blue" style="font-size:28px"></i><div style="position:absolute;width:60px;height:12px;background:linear-gradient(90deg, rgba(0, 242, 254, 0.8), transparent);top:8px;left:-45px;border-radius:10px;transform:rotate(-15deg);"></div></div>';
    }

    // Toggle Visibility
    defaultInfoPrompt.classList.remove('active');
    planetInfoCard.classList.add('active');
}

// Register click events on planet divs
document.querySelectorAll('.celestial-body').forEach(el => {
    el.addEventListener('click', () => {
        const bodyId = el.getAttribute('data-body');
        selectBody(bodyId);
    });
});

// Register click events on shortcut buttons
document.querySelectorAll('.wonder-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const bodyId = btn.getAttribute('data-body');
        selectBody(bodyId);
    });
});

// Back to scanner main prompt
document.querySelector('.back-to-prompt-btn').addEventListener('click', () => {
    synth.playClick();
    planetInfoCard.classList.remove('active');
    defaultInfoPrompt.classList.add('active');
});

// Initialize orbits animation
animateOrbits();


// --- 5. CLASSIFICATION DRAG & DROP GAME ---
const gamePlanetList = [
    { id: 'game-mercury', name: 'ดาวพุธ', group: 'terrestrial', colorClass: 'mercury' },
    { id: 'game-venus', name: 'ดาวศุกร์', group: 'terrestrial', colorClass: 'venus' },
    { id: 'game-earth', name: 'โลก', group: 'terrestrial', colorClass: 'earth' },
    { id: 'game-mars', name: 'ดาวอังคาร', group: 'terrestrial', colorClass: 'mars' },
    { id: 'game-jupiter', name: 'ดาวพฤหัสบดี', group: 'gas', colorClass: 'jupiter' },
    { id: 'game-saturn', name: 'ดาวเสาร์', group: 'gas', colorClass: 'saturn' },
    { id: 'game-uranus', name: 'ดาวยูเรนัส', group: 'gas', colorClass: 'uranus' },
    { id: 'game-neptune', name: 'ดาวเนปจูน', group: 'gas', colorClass: 'neptune' }
];

let selectedGamePlanetEl = null; // for mobile touch select-and-move

function initGame() {
    selectedGamePlanetEl = null;
    const sourceContainer = document.getElementById('source-planets-container');
    const slotTerrestrial = document.getElementById('slots-terrestrial');
    const slotGas = document.getElementById('slots-gas');
    
    // Clear all
    sourceContainer.innerHTML = '';
    slotTerrestrial.innerHTML = '';
    slotGas.innerHTML = '';
    document.getElementById('current-score').innerText = '0';
    
    // Shuffle list
    const shuffled = [...gamePlanetList].sort(() => Math.random() - 0.5);
    
    // Render draggable elements in source
    shuffled.forEach(p => {
        const el = document.createElement('div');
        el.className = 'planet-drag-item';
        el.draggable = true;
        el.id = p.id;
        el.dataset.group = p.group;
        el.dataset.name = p.name;
        
        el.innerHTML = `
            <div class="drag-dot ${p.colorClass}"></div>
            <span class="drag-label">${p.name}</span>
        `;
        
        // HTML5 Drag Event Listeners (Desktop mouse drag)
        el.addEventListener('dragstart', (e) => {
            el.classList.add('dragging');
            e.dataTransfer.setData('text/plain', el.id);
        });
        
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
        });

        // Hybrid click fallback (Mobile & touch-friendly)
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            synth.playHover();
            
            // If it is inside a dropzone slot, clicking it moves it back to source panel
            if (el.parentElement.classList.contains('dropzone-slots')) {
                sourceContainer.appendChild(el);
                updateGameScore();
                return;
            }

            // Otherwise, toggle selection
            if (selectedGamePlanetEl === el) {
                el.classList.remove('selected');
                selectedGamePlanetEl = null;
            } else {
                if (selectedGamePlanetEl) {
                    selectedGamePlanetEl.classList.remove('selected');
                }
                el.classList.add('selected');
                selectedGamePlanetEl = el;
            }
        });
        
        sourceContainer.appendChild(el);
    });
}

// Setup Dropzones
const dropzones = document.querySelectorAll('.dropzone-box');
dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault(); // Required to allow drop
        zone.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        
        const planetId = e.dataTransfer.getData('text/plain');
        const planetEl = document.getElementById(planetId);
        if (planetEl) {
            const slots = zone.querySelector('.dropzone-slots');
            slots.appendChild(planetEl);
            updateGameScore();
            synth.playClick();
        }
    });

    // Touch support click handler
    zone.addEventListener('click', () => {
        if (selectedGamePlanetEl) {
            const slots = zone.querySelector('.dropzone-slots');
            slots.appendChild(selectedGamePlanetEl);
            selectedGamePlanetEl.classList.remove('selected');
            selectedGamePlanetEl = null;
            updateGameScore();
            synth.playClick();
        }
    });
});

// Click outside planets clears selection
document.addEventListener('click', () => {
    if (selectedGamePlanetEl) {
        selectedGamePlanetEl.classList.remove('selected');
        selectedGamePlanetEl = null;
    }
});

function updateGameScore() {
    const tCount = document.getElementById('slots-terrestrial').children.length;
    const gCount = document.getElementById('slots-gas').children.length;
    const total = tCount + gCount;
    document.getElementById('current-score').innerText = total;
}

// Check Answers Button
document.getElementById('btn-check-game').addEventListener('click', () => {
    const tSlots = document.getElementById('slots-terrestrial').children;
    const gSlots = document.getElementById('slots-gas').children;
    const sourceCount = document.getElementById('source-planets-container').children.length;

    // Check if they placed all planets
    if (sourceCount > 0) {
        synth.playIncorrect();
        showGameFeedback(
            '<i class="fa-solid fa-circle-exclamation text-neon-orange"></i>',
            "ยังจัดสรรดาวไม่ครบเลยนะจ๊ะ!",
            `น้องๆ ยังเหลือดาวเคราะห์อีก ${sourceCount} ดวงค้างอยู่ด้านซ้ายมือ ช่วยพาพวกมันทั้งหมดขึ้นกระสวยอวกาศให้เรียบร้อยก่อนกดตรวจน้า`
        );
        return;
    }

    let mistakes = 0;
    
    // Verify Terrestrial Group
    for (let item of tSlots) {
        if (item.dataset.group !== 'terrestrial') {
            mistakes++;
            item.style.borderColor = 'var(--neon-pink)';
            item.classList.add('animate-shake');
            setTimeout(() => item.classList.remove('animate-shake'), 600);
        } else {
            item.style.borderColor = 'var(--neon-green)';
        }
    }

    // Verify Gas Group
    for (let item of gSlots) {
        if (item.dataset.group !== 'gas') {
            mistakes++;
            item.style.borderColor = 'var(--neon-pink)';
            item.classList.add('animate-shake');
            setTimeout(() => item.classList.remove('animate-shake'), 600);
        } else {
            item.style.borderColor = 'var(--neon-green)';
        }
    }

    if (mistakes === 0) {
        synth.playSuccess();
        showGameFeedback(
            '<i class="fa-solid fa-award text-neon-yellow"></i>',
            "ภารกิจสำเร็จลุล่วง!",
            "เยี่ยมยอดมากนักบินอวกาศน้อย! น้องสามารถจัดหมวดหมู่กลุ่มดาวเคราะห์หิน (พุธ ศุกร์ โลก อังคาร) และกลุ่มดาวเคราะห์แก๊ส (พฤหัสบดี เสาร์ ยูเรนัส เนปจูน) ได้ถูกต้องครบถ้วนสมบูรณ์!"
        );
    } else {
        synth.playIncorrect();
        showGameFeedback(
            '<i class="fa-solid fa-triangle-exclamation text-neon-pink"></i>',
            "เอ๊ะ... ยังมีจุดผิดพลาดอยู่บ้าง!",
            `พบจุดคัดแยกไม่ตรงกลุ่มทั้งหมด ${mistakes} จุด (ดาวเคราะห์ดวงที่ขอบกระสวยกะพริบสีแดง) ลองย้ายมันสลับกลุ่มแล้วเช็คความถูกต้องใหม่อีกครั้งนะ!`
        );
    }
});

// Reset Game Button
document.getElementById('btn-reset-game').addEventListener('click', () => {
    synth.playClick();
    initGame();
});

// Modal Overlay Functions
function showGameFeedback(iconHtml, title, msg) {
    document.getElementById('feedback-icon-container').innerHTML = iconHtml;
    document.getElementById('feedback-title').innerText = title;
    document.getElementById('feedback-message').innerText = msg;
    document.getElementById('game-feedback-overlay').classList.add('active');
}

function closeGameFeedback() {
    synth.playClick();
    document.getElementById('game-feedback-overlay').classList.remove('active');
}


// --- 6. CANVAS TIDE SIMULATION ---
const canvas = document.getElementById('tide-simulator-canvas');
const ctx = canvas.getContext('2d');

let tideAnimRunning = true;
let moonAngleDeg = 0; // Starts at Spring Tide alignment (Moon aligned with Sun)
let waveOffset = 0; // For animating ripples

const earthX = 220;
const earthY = 200;
const earthR = 45;
const moonOrbitR = 130;
const sunX = 640;
const sunY = 200;
const sunR = 80;

function drawTideSimulator() {
    if (!canvas || !ctx) return;
    
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw Starry Space background (inside simulator box)
    ctx.fillStyle = '#010308';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle grid lines for radar style
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
    }

    // 2. Draw Sun (on the right)
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
    sunGradient.addColorStop(0, '#fff6bd');
    sunGradient.addColorStop(0.3, '#ffaa00');
    sunGradient.addColorStop(1, 'rgba(204, 51, 0, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sun Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '11px Kanit';
    ctx.textAlign = 'center';
    ctx.fillText('ดวงอาทิตย์ (มีแรงโน้มถ่วงเสริม)', sunX - 35, sunY - 45);

    // 3. Draw Moon Orbit Path around Earth
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(earthX, earthY, moonOrbitR, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 4. Calculate Tide Status & Water Bulge geometry
    // Moon angle in radians
    const moonRad = (moonAngleDeg * Math.PI) / 180;
    
    // Align of Sun-Earth-Moon
    // 0 deg = New moon (Moon directly between Earth & Sun)
    // 180 deg = Full moon (Moon opposite to Sun)
    // 90 & 270 deg = Quarter moons (Moon perpendicular to Sun)
    
    // We compute alignment factor: 1.0 when aligned (Spring Tide), 0.0 when perpendicular (Neap Tide)
    // cos(2 * theta) handles double symmetry (peaks at 0 and 180)
    const alignmentFactor = Math.abs(Math.cos(2 * moonRad)); 
    const isSpringTide = Math.abs(Math.cos(2 * moonRad)) > 0.707; // threshold
    
    // Update live indicators in the right console
    updateTideStatusBadge(moonAngleDeg, isSpringTide);

    // 5. Draw Gravitational Pull waves (dotted lines from Moon to Earth and Sun to Earth)
    const moonX = earthX + moonOrbitR * Math.cos(moonRad);
    const moonY = earthY + moonOrbitR * Math.sin(moonRad);
    
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    
    // Earth-Moon gravity vector
    ctx.beginPath();
    ctx.moveTo(earthX, earthY);
    ctx.lineTo(moonX, moonY);
    ctx.stroke();

    // Earth-Sun gravity vector (always horizontal along the right)
    ctx.strokeStyle = 'rgba(255, 102, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(earthX, earthY);
    ctx.lineTo(sunX - sunR + 20, earthY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // 6. Draw Ocean Bulge Envelope (Vectorized Physically-Inspired Ellipse)
    // We compute 100 points around Earth
    ctx.fillStyle = 'rgba(0, 242, 254, 0.22)';
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
    ctx.lineWidth = 2.5;
    
    // Apply wave offset animation
    waveOffset += 0.03;
    
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
        const theta = (i * 2 * Math.PI) / 100;
        
        // Gravitational force formulas (Moon + Sun)
        // Moon gravity pull height: peaks in direction of Moon (moonRad) and opposite (moonRad + PI)
        const moonPull = 12 * Math.pow(Math.cos(theta - moonRad), 2);
        
        // Sun gravity pull height: peaks in direction of Sun (0) and opposite (PI)
        const sunPull = 4.5 * Math.pow(Math.cos(theta - 0), 2);
        
        // Dynamic water level adding wave ripples for active look
        const ripple = 0.8 * Math.sin(theta * 12 + waveOffset);
        
        const waterRadius = earthR + 6 + moonPull + sunPull + ripple;
        
        const px = earthX + waterRadius * Math.cos(theta);
        const py = earthY + waterRadius * Math.sin(theta);
        
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 7. Draw Earth inside
    const earthGrad = ctx.createRadialGradient(earthX, earthY, 10, earthX, earthY, earthR);
    earthGrad.addColorStop(0, '#75c5fd');
    earthGrad.addColorStop(0.7, '#246eb9');
    earthGrad.addColorStop(1, '#0e345f');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw simple continents to look like Earth
    ctx.fillStyle = '#4fa953';
    // Continent A
    ctx.beginPath();
    ctx.arc(earthX - 10, earthY - 15, 12, 0, 2*Math.PI);
    ctx.arc(earthX - 5, earthY - 8, 15, 0, 2*Math.PI);
    ctx.fill();
    // Continent B
    ctx.beginPath();
    ctx.arc(earthX + 15, earthY + 12, 14, 0, 2*Math.PI);
    ctx.arc(earthX + 8, earthY + 18, 10, 0, 2*Math.PI);
    ctx.fill();

    // Earth Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Kanit';
    ctx.fillText('โลก', earthX, earthY + 5);

    // 8. Draw Moon
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 10);
    moonGrad.addColorStop(0, '#f0f0f0');
    moonGrad.addColorStop(0.6, '#b0b0b0');
    moonGrad.addColorStop(1, '#666');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw craters
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(moonX - 3, moonY - 3, 2, 0, 2*Math.PI);
    ctx.arc(moonX + 3, moonY + 2, 2.5, 0, 2*Math.PI);
    ctx.arc(moonX - 2, moonY + 4, 1.5, 0, 2*Math.PI);
    ctx.fill();

    // Moon Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '10px Kanit';
    ctx.fillText('ดวงจันทร์', moonX, moonY - 15);

    // 9. Text labels for high/low tide zones (always perpendicular to water bulge)
    // The major axis orientation angle of total bulge:
    // It is primarily determined by Moon's position since moon gravity is 12 vs sun 4.
    // High tide is along the Moon's vector, Low tide is perpendicular (90 degrees to Moon vector)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Kanit';
    
    // High Tide Label A (Moon side)
    const htAx = earthX + (earthR + 32) * Math.cos(moonRad);
    const htAy = earthY + (earthR + 32) * Math.sin(moonRad);
    ctx.fillText('น้ำขึ้นสูงสุด', htAx, htAy);
    
    // High Tide Label B (Opposite Moon side)
    const htBx = earthX + (earthR + 25) * Math.cos(moonRad + Math.PI);
    const htBy = earthY + (earthR + 25) * Math.sin(moonRad + Math.PI);
    ctx.fillText('น้ำขึ้นสูงสุด', htBx, htBy);

    // Low Tide Label A (Perpendicular +90)
    const ltAx = earthX + (earthR + 15) * Math.cos(moonRad + Math.PI/2);
    const ltAy = earthY + (earthR + 15) * Math.sin(moonRad + Math.PI/2);
    ctx.fillText('น้ำลงต่ำสุด', ltAx, ltAy);

    // Low Tide Label B (Perpendicular -90)
    const ltBx = earthX + (earthR + 15) * Math.cos(moonRad - Math.PI/2);
    const ltBy = earthY + (earthR + 15) * Math.sin(moonRad - Math.PI/2);
    ctx.fillText('น้ำลงต่ำสุด', ltBx, ltBy);

    // Trigger loop if running
    if (tideAnimRunning) {
        // Increment moon angle slowly
        moonAngleDeg = (moonAngleDeg + 0.5) % 360;
        
        // Update slider position
        document.getElementById('moon-angle-slider').value = Math.round(moonAngleDeg);
        document.getElementById('moon-angle-val').innerText = Math.round(moonAngleDeg);
    }
}

function updateTideStatusBadge(angle, isSpring) {
    const badge = document.getElementById('tide-status-badge');
    const detail = document.getElementById('tide-status-detail');
    
    if (isSpring) {
        badge.className = "tide-badge-active spring-tide";
        badge.innerHTML = '<i class="fa-solid fa-arrows-left-right-to-line"></i> น้ำเกิด (Spring Tide) - สูงสุด/ต่ำสุด';
        detail.innerHTML = `<strong>ตำแหน่งดวงจันทร์ประมาณ ${Math.round(angle)}°:</strong> ดวงจันทร์ โลก และดวงอาทิตย์เกือบเรียงตัวเป็น<strong>เส้นตรงเดียวกัน</strong> (วันเพ็ญขึ้น 15 ค่ำ หรือ แรม 15 ค่ำ) ทำให้แรงโน้มถ่วงของดวงจันทร์และดวงอาทิตย์ร่วมมือกันดึงน้ำให้ขึ้นสูงที่สุดและลดลงต่ำที่สุดในรอบเดือน`;
    } else {
        badge.className = "tide-badge-active neap-tide";
        badge.innerHTML = '<i class="fa-solid fa-arrows-up-down"></i> น้ำตาย (Neap Tide) - ระดับน้ำนิ่ง';
        detail.innerHTML = `<strong>ตำแหน่งดวงจันทร์ประมาณ ${Math.round(angle)}°:</strong> ดวงจันทร์โคจรทำมุม<strong>ตั้งฉาก 90°</strong> กับแกนโลกและดวงอาทิตย์ (วันขึ้น 8 ค่ำ หรือ แรม 8 ค่ำ) แรงดึงดูดของทั้งสองจึงหักล้างกันเอง ส่งผลให้ระดับน้ำขึ้นและน้ำลงต่างกันน้อยมาก ดูนิ่งๆ คล้ายน้ำตาย`;
    }
}

// Hook tide animation loop
let tideLoopId = null;
function tideSimulationLoop() {
    drawTideSimulator();
    tideLoopId = requestAnimationFrame(tSimulationLoopCall);
}
// Helper to prevent context errors
function tSimulationLoopCall() {
    tideSimulationLoop();
}

function startTideSimulation() {
    tideAnimRunning = true;
    document.getElementById('btn-tide-play').classList.add('active');
    document.getElementById('btn-tide-pause').classList.remove('active');
    if (!tideLoopId) {
        tideSimulationLoop();
    }
}

function stopTideSimulation() {
    tideAnimRunning = false;
    document.getElementById('btn-tide-play').classList.remove('active');
    document.getElementById('btn-tide-pause').classList.add('active');
    if (tideLoopId) {
        cancelAnimationFrame(tideLoopId);
        tideLoopId = null;
    }
}

// Slider Manual Event
const moonSlider = document.getElementById('moon-angle-slider');
moonSlider.addEventListener('input', (e) => {
    // If user is scrubbing, pause autoplay
    stopTideSimulation();
    
    moonAngleDeg = parseInt(e.target.value);
    document.getElementById('moon-angle-val').innerText = moonAngleDeg;
    
    // Draw single frame immediately
    drawTideSimulator();
});

// Play/Pause buttons
document.getElementById('btn-tide-play').addEventListener('click', () => {
    synth.playClick();
    startTideSimulation();
});
document.getElementById('btn-tide-pause').addEventListener('click', () => {
    synth.playClick();
    stopTideSimulation();
});


// --- 7. INTERACTIVE COSMIC QUIZ ENGINE ---
const quizQuestions = [
    {
        q: "1. ข้อใดกล่าวถึง 'ดวงอาทิตย์' ได้อย่างถูกต้องที่สุดตามข้อมูลบทเรียน?",
        a: [
            "เป็นดาวเคราะห์หินที่มีสิ่งมีชีวิตอาศัยอยู่หนาแน่น",
            "เป็นดาวเคราะห์แก๊สขนาดมหึมาที่ไม่มีวงแหวนบริวาร",
            "เป็นดาวฤกษ์เพียงดวงเดียวในระบบที่มีแสงสว่างและความร้อนในตัวเอง",
            "เป็นดาวบริวารขนาดเล็กของโลกที่คอยดึงน้ำขึ้นน้ำลง"
        ],
        correct: 2 // index 2
    },
    {
        q: "2. น้องๆ สามารถแบ่งกลุ่มดาวเคราะห์ตามลักษณะพื้นผิวได้เป็นสองกลุ่มหลักคือข้อใด?",
        a: [
            "ดาวเคราะห์ใหญ่ และ ดาวเคราะห์เล็ก",
            "ดาวเคราะห์หิน และ ดาวเคราะห์แก๊ส",
            "ดาวเคราะห์ฝุ่น และ ดาวเคราะห์น้ำแข็ง",
            "ดาวเคราะห์ดินเหนียว และ ดาวเคราะห์หินปูน"
        ],
        correct: 1
    },
    {
        q: "3. ดาวเคราะห์ดวงใดจัดอยู่ในกลุ่ม 'ดาวเคราะห์หิน' (มีพื้นผิวแข็ง) ทั้งหมด?",
        a: [
            "ดาวพุธ, ดาวศุกร์, โลก, ดาวอังคาร",
            "ดาวพฤหัสบดี, ดาวเสาร์, ดาวยูเรนัส, ดาวเนปจูน",
            "ดาวพุธ, โลก, ดาวเสาร์, ดาวยูเรนัส",
            "ดาวศุกร์, ดาวอังคาร, ดาวเนปจูน, พลูโต"
        ],
        correct: 0
    },
    {
        q: "4. ดาวเคราะห์กลุ่มดาวเคราะห์แก๊สซึ่งอยู่ห่างดวงอาทิตย์ออกไป มีลักษณะสำคัญอย่างไร?",
        a: [
            "มีขนาดเล็กและมีพื้นผิวแข็งปูด้วยดินและหิน",
            "มีขนาดใหญ่มากและมีส่วนประกอบส่วนใหญ่เป็นแก๊ส",
            "มีแสงสว่างและความร้อนในตัวเองเหมือนดวงอาทิตย์",
            "มีดวงจันทร์บริวารดวงเดียวเท่ากับโลก"
        ],
        correct: 1
    },
    {
        q: "5. ปรากฏการณ์ 'น้ำขึ้น-น้ำลง' บนโลกของเรา เกิดขึ้นจากสาเหตุใดมากที่สุด?",
        a: [
            "ลมพายุสุริยะที่รุนแรงพัดน้ำในทะเลให้เอ่อล้นออกไป",
            "แรงดึงดูดของดวงอาทิตย์เพียงดวงเดียวส่งผ่านพลังงานในอวกาศ",
            "ความร้อนของดวงอาทิตย์ทำให้น้ำเดือดแล้วเกิดการขยายตัวขึ้น",
            "แรงดึงดูดของดวงจันทร์ที่กระทำต่อโลกดึงให้น้ำในมหาสมุทรเป่งออก"
        ],
        correct: 3
    },
    {
        q: "6. 'ดาวเคราะห์แคระพลูโต' แถบดาวเคราะห์น้อย และดาวหาง จัดเป็นสิ่งมหัศจรรย์อื่นๆ ในระบบสุริยะ ข้อใดเปรียบเปรยถึง 'ดาวหาง' ได้ถูกต้อง?",
        a: [
            "แถบก้อนหินอวกาศลอยคั่นระหว่างดาวอังคารกับดาวพฤหัส",
            "นักเดินทางน้ำแข็งจากขอบระบบสุริยะที่มีหางยาวชี้หนีดวงอาทิตย์",
            "ดาวเคราะห์แก๊สขนาดใหญ่ที่สุดในระบบที่มีจุดแดงใหญ่",
            "ดาวบริวารหลักดวงเดียวของโลกที่เป็นสีน้ำเงินลอยคว้าง"
        ],
        correct: 1
    },
    {
        q: "7. ดาวพุธซึ่งอยู่ใกล้ดวงอาทิตย์ที่สุดในระบบสุริยะ ได้รับฉายาที่เปรียบเปรยถึงสภาพอากาศว่าอย่างไร?",
        a: [
            "เตาไฟแช่แข็ง",
            "ดาวฝาแฝดของโลก",
            "พี่ใหญ่กวาดขยะอวกาศ",
            "ลูกบอลตะแคงข้าง"
        ],
        correct: 0
    },
    {
        q: "8. เหตุใด 'ดาวศุกร์' จึงเป็นดาวเคราะห์ที่ร้อนที่สุดในระบบสุริยะ ทั้งที่ดาวพุธอยู่ใกล้ดวงอาทิตย์มากกว่า?",
        a: [
            "เพราะดาวศุกร์มีดวงจันทร์บริวารจำนวนมากคอยช่วยผลิตความร้อน",
            "เพราะดาวศุกร์มีชั้นบรรยากาศหนาทึบด้วยคาร์บอนไดออกไซด์ที่กักเก็บความร้อนรุนแรง",
            "เพราะดาวศุกร์โคจรรอบตัวเองเร็วมากทำให้เกิดแรงเสียดทานจนร้อน",
            "เพราะพื้นผิวของดาวศุกร์เต็มไปด้วยสนิมเหล็กและแกนหินละลายปะทุตลอดเวลา"
        ],
        correct: 1
    },
    {
        q: "9. ข้อใดคือคุณสมบัติที่น่าทึ่งของ 'ดาวเสาร์' ที่เกิดจากองค์ประกอบแก๊สที่มีความหนาแน่นต่ำ?",
        a: [
            "มีแกนเอียงเกือบราบไปกับระนาบโคจรดูเหมือนนอนกลิ้ง",
            "เป็นดาวดวงเดียวที่มีความหนาแน่นต่ำกว่าน้ำและสามารถลอยน้ำได้",
            "มีพายุหมุนความเร็วสูงสุดพัดเร็วถึง 2,100 กิโลเมตรต่อชั่วโมง",
            "ไม่มีบริวารและไม่มีชั้นบรรยากาศคอยดึงน้ำขึ้นน้ำลง"
        ],
        correct: 1
    },
    {
        q: "10. ปรากฏการณ์ 'น้ำเกิด' (Spring Tide) ที่ระดับน้ำขึ้นสูงสุดและลดลงต่ำสุด เกิดขึ้นเมื่อดวงดาวมีลักษณะการจัดเรียงตัวแบบใด?",
        a: [
            "ดวงจันทร์ตั้งฉาก 90 องศากับโลกและดวงอาทิตย์",
            "ดวงจันทร์ โลก และดวงอาทิตย์ เรียงตัวเป็นแนวเส้นตรงเดียวกัน",
            "โลกเคลื่อนที่ไปอยู่ไกลที่สุดจากดวงอาทิตย์ขอบระบบสุริยะ",
            "ดาวเคราะห์แก๊สทั้ง 4 ดวงเคลื่อนที่มาเรียงซ้อนทับกันพอดี"
        ],
        correct: 1
    }
];

let quizCurrentIndex = 0;
let quizScore = 0;
let studentName = "";
let selectedAnswerIndex = null;

const quizIntroCard = document.getElementById('quiz-intro-card');
const quizQuestionCard = document.getElementById('quiz-question-card');
const quizResultCard = document.getElementById('quiz-result-card');
const studentNameInput = document.getElementById('student-name-input');
const nameInputError = document.getElementById('name-input-error');

// Start Quiz button click
document.getElementById('btn-start-quiz').addEventListener('click', () => {
    studentName = studentNameInput.value.trim();
    
    if (studentName === "") {
        synth.playIncorrect();
        nameInputError.style.display = 'block';
        studentNameInput.focus();
        return;
    }
    
    synth.playClick();
    nameInputError.style.display = 'none';
    quizCurrentIndex = 0;
    quizScore = 0;
    
    quizIntroCard.classList.remove('active');
    quizQuestionCard.classList.add('active');
    
    renderQuizQuestion();
});

function renderQuizQuestion() {
    selectedAnswerIndex = null;
    document.getElementById('btn-submit-answer').disabled = true;
    
    const question = quizQuestions[quizCurrentIndex];
    
    // Update Question Info UI
    document.getElementById('current-question-num').innerText = quizCurrentIndex + 1;
    const progressPercent = ((quizCurrentIndex) / quizQuestions.length) * 100;
    document.getElementById('current-progress-percent').innerText = `${Math.round(progressPercent)}%`;
    document.getElementById('quiz-progress-fill').style.width = `${progressPercent}%`;
    
    // Question Text
    document.getElementById('question-text').innerText = question.q;
    
    // Choice Container
    const optionsContainer = document.getElementById('quiz-options-container');
    optionsContainer.innerHTML = '';
    
    const prefixes = ['A', 'B', 'C', 'D'];
    question.a.forEach((choice, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `
            <span class="option-prefix">${prefixes[idx]}</span>
            <span class="option-text">${choice}</span>
        `;
        
        btn.addEventListener('click', () => {
            synth.playHover();
            selectedAnswerIndex = idx;
            
            // Highlight selected option
            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            // Enable Submit Button
            document.getElementById('btn-submit-answer').disabled = false;
        });
        
        optionsContainer.appendChild(btn);
    });
}

// Submit Answer Button click
document.getElementById('btn-submit-answer').addEventListener('click', () => {
    if (selectedAnswerIndex === null) return;
    
    const question = quizQuestions[quizCurrentIndex];
    const optionButtons = document.querySelectorAll('.option-btn');
    
    // Disable clicking other options
    optionButtons.forEach(btn => btn.style.pointerEvents = 'none');
    document.getElementById('btn-submit-answer').disabled = true;
    
    const isCorrect = (selectedAnswerIndex === question.correct);
    
    if (isCorrect) {
        quizScore++;
        synth.playCorrect();
        optionButtons[selectedAnswerIndex].style.borderColor = 'var(--neon-green)';
        optionButtons[selectedAnswerIndex].style.background = 'rgba(57, 255, 20, 0.08)';
    } else {
        synth.playIncorrect();
        optionButtons[selectedAnswerIndex].style.borderColor = 'var(--neon-pink)';
        optionButtons[selectedAnswerIndex].style.background = 'rgba(255, 0, 127, 0.08)';
        
        // Highlight correct option in green
        optionButtons[question.correct].style.borderColor = 'var(--neon-green)';
    }

    // Delay a bit and advance
    setTimeout(() => {
        quizCurrentIndex++;
        if (quizCurrentIndex < quizQuestions.length) {
            renderQuizQuestion();
        } else {
            showQuizResults();
        }
    }, 1800);
});

function showQuizResults() {
    quizQuestionCard.classList.remove('active');
    quizResultCard.classList.add('active');
    
    // Save to local storage leaderboard
    saveScore(studentName, quizScore);
    
    // Update Score display
    document.getElementById('final-score-val').innerText = quizScore;
    
    const commentEl = document.getElementById('result-comment');
    const claimBox = document.getElementById('certificate-claim-box');
    const iconDiv = document.getElementById('result-icon-div');
    
    if (quizScore >= 8) {
        // High Score -> Enable Certificate Claim (>= 8/10)
        synth.playSuccess();
        iconDiv.className = "result-trophy-icon text-neon-yellow";
        iconDiv.innerHTML = '<i class="fa-solid fa-trophy"></i>';
        commentEl.innerHTML = `<strong>ยอดเยี่ยมมาก นักสำรวจคอสมิก!</strong> น้องสอบผ่านด้วยคะแนน <strong>${quizScore}/10</strong> ได้สำเร็จ ยานแม่ขอรับรองเกียรตินิยมผู้พิทักษ์ระบบสุริยะและบันทึกคะแนนลงกระดานเกียรติยศให้ทันที!`;
        claimBox.style.display = 'flex';
    } else {
        // Low Score -> Disable Certificate Claim
        synth.playIncorrect();
        iconDiv.className = "result-trophy-icon text-neon-pink";
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
        commentEl.innerHTML = `<strong>สู้ๆ นะจ๊ะ นักเรียนอวกาศน้อย!</strong> น้องได้คะแนน <strong>${quizScore}/10</strong> คะแนน คะแนนของน้องถูกบันทึกไว้แล้ว ลองกลับไปทบทวนบทเรียนและทำข้อสอบใหม่เพื่อให้ได้ 8/10 ขึ้นไปเพื่อรับเกียรติบัตรนะ!`;
        claimBox.style.display = 'none';
    }
}

// Claim Certificate button click
document.getElementById('btn-show-certificate').addEventListener('click', () => {
    synth.playClick();
    
    // Update student name on certificate
    document.getElementById('cert-student-name-display').innerText = studentName;
    
    // Open Overlay
    document.getElementById('certificate-overlay').classList.add('active');
});

// Close Certificate Overlay
function closeCertificate() {
    synth.playClick();
    document.getElementById('certificate-overlay').classList.remove('active');
}

// Print Certificate
document.getElementById('btn-print-certificate').addEventListener('click', () => {
    synth.playClick();
    window.print();
});

// Restart Quiz button click
document.getElementById('btn-restart-quiz').addEventListener('click', () => {
    synth.playClick();
    quizResultCard.classList.remove('active');
    quizIntroCard.classList.add('active');
    studentNameInput.value = "";
});


// --- 8. LEADERBOARD SYSTEM ---
const LOCAL_STORAGE_KEY = 'astronomy_leaderboard_v1';

function loadScores() {
    try {
        const scoresRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (scoresRaw) {
            const data = JSON.parse(scoresRaw);
            // Sort by score (descending), then date (descending)
            return data.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return new Date(b.date) - new Date(a.date);
            });
        }
    } catch (e) {
        console.error("Local storage read error", e);
    }
    return [];
}

function saveScore(name, score) {
    const scores = loadScores();
    const newRecord = {
        name: name,
        score: score,
        date: new Date().toISOString()
    };
    scores.push(newRecord);
    
    // Cap leaderboard at top 100 entries for safety
    const capped = scores.sort((a, b) => b.score - a.score).slice(0, 100);
    
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(capped));
    } catch (e) {
        console.error("Local storage write error", e);
    }
}

function renderLeaderboard() {
    const scores = loadScores();
    const tbody = document.getElementById('leaderboard-tbody');
    const emptyMsg = document.getElementById('leaderboard-empty');
    
    tbody.innerHTML = '';
    
    if (scores.length === 0) {
        emptyMsg.classList.add('active');
        return;
    } else {
        emptyMsg.classList.remove('active');
    }
    
    scores.forEach((entry, idx) => {
        const rank = idx + 1;
        const row = document.createElement('tr');
        
        // Format date and time
        let formattedDate = "";
        try {
            const d = new Date(entry.date);
            const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const day = d.getDate();
            const month = months[d.getMonth()];
            const year = d.getFullYear() + 543; // Buddhist Era
            const hours = String(d.getHours()).padStart(2, '0');
            const mins = String(d.getMinutes()).padStart(2, '0');
            formattedDate = `${day} ${month} ${year} (${hours}:${mins} น.)`;
        } catch (e) {
            formattedDate = entry.date;
        }
        
        // Rank Badge
        let rankHtml = "";
        if (rank === 1) {
            rankHtml = `<span class="rank-badge rank-1" title="เหรียญทอง"><i class="fa-solid fa-trophy"></i></span>`;
        } else if (rank === 2) {
            rankHtml = `<span class="rank-badge rank-2" title="เหรียญเงิน"><i class="fa-solid fa-medal"></i></span>`;
        } else if (rank === 3) {
            rankHtml = `<span class="rank-badge rank-3" title="เหรียญทองแดง"><i class="fa-solid fa-medal"></i></span>`;
        } else {
            rankHtml = `<span class="rank-badge rank-other">${rank}</span>`;
        }
        
        row.innerHTML = `
            <td class="td-rank">${rankHtml}</td>
            <td class="td-name">${escapeHTML(entry.name)}</td>
            <td class="td-score">${entry.score}</td>
            <td class="td-date">${formattedDate}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Clear Leaderboard trigger
document.getElementById('btn-clear-leaderboard').addEventListener('click', () => {
    synth.playClick();
    const conf = confirm("คุณครูต้องการล้างคะแนนสถิติทั้งหมดบนกระดานคะแนนใช่หรือไม่จ๊ะ? (การลบนี้ไม่สามารถย้อนคืนได้)");
    if (conf) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        synth.playSuccess();
        renderLeaderboard();
    }
});
