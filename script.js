const vp = document.getElementById('viewport');
const sh = document.getElementById('shield');
const hf = document.getElementById('hp-fill');
const sc = document.getElementById('score');
const al = document.getElementById('albedo');
const lv = document.getElementById('level-num');
const gl = document.getElementById('glacier');
const ts = document.getElementById('toast');

let game = { score: 0, hp: 100, level: 1, active: false, speed: 4, rate: 800, name: "" };

function startGame() {
    const nameInput = document.getElementById('user-name').value.trim();
    if (!nameInput) { alert("Please enter your name!"); return; }
    
    game.name = nameInput;
    game.active = true;
    document.getElementById('start-screen').style.display = 'none';
    sh.style.display = 'block';
    
    spawnTimer = setInterval(spawn, game.rate);
}

const move = (e) => {
    if (!game.active) return;
    const rect = vp.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    sh.style.left = Math.max(50, Math.min(rect.width - 50, x)) + 'px';
};
vp.addEventListener('mousemove', move);
vp.addEventListener('touchmove', move, { passive: true });

function refresh() {
    const r = Math.min(game.score / 1500, 1);
    vp.style.background = `rgb(${44-r*20}, ${62+r*100}, ${80+r*150})`;
    const bonus = Math.min(game.score / 50, 20);
    gl.style.height = (game.hp * 0.35 + bonus) + "%";
    const p1 = 40 - r*25, p2 = 20 - r*15, p3 = 30 - r*20;
    gl.style.clipPath = `polygon(0% 100%, 15% ${p1}%, 35% 65%, 50% ${p2}%, 70% 55%, 85% ${p3}%, 100% 100%)`;
    gl.style.backgroundColor = `hsl(190, 100%, ${Math.min(75+game.score/20, 100)}%)`;
    al.innerText = Math.min(100, 85 + Math.floor(game.score/50));
}

let spawnTimer;
function spawn() {
    if (!game.active) return;
    const p = document.createElement('div');
    p.className = 'drop';
    p.style.left = Math.random() * (vp.clientWidth - 15) + 'px';
    p.style.top = '0px';
    vp.appendChild(p);

    let y = 0;
    let drift = (Math.random() - 0.5) * game.level; 

    let moveInterval = setInterval(() => {
        if (!game.active) { clearInterval(moveInterval); p.remove(); return; }
        y += game.speed;
        p.style.top = y + 'px';
        p.style.left = (parseFloat(p.style.left) + drift) + 'px';

        const sRect = sh.getBoundingClientRect();
        const pRect = p.getBoundingClientRect();

        if (pRect.bottom >= sRect.top && pRect.top <= sRect.bottom &&
            pRect.right >= sRect.left && pRect.left <= sRect.right) {
            clearInterval(moveInterval); p.remove();
            hitSuccess();
        } else if (y > vp.clientHeight - 40) {
            clearInterval(moveInterval); p.remove();
            hitFail();
        }
    }, 20);
}

function hitSuccess() {
    game.score += (10 * game.level);
    sc.innerText = game.score;
    if (game.hp < 100) { game.hp = Math.min(100, game.hp + 0.5); hf.style.width = game.hp + "%"; }
    refresh();
    if (game.score > game.level * 300) {
        game.level++;
        game.speed += 0.8;
        game.rate = Math.max(200, game.rate - 100);
        lv.innerText = game.level;
        clearInterval(spawnTimer);
        spawnTimer = setInterval(spawn, game.rate);
        ts.innerText = `LEVEL UP: STAGE ${game.level} 🚀`;
        ts.style.top = "15px"; setTimeout(()=>ts.style.top="-50px", 2000);
    }
}

function hitFail() {
    game.hp -= 8;
    hf.style.width = Math.max(0, game.hp) + "%";
    refresh();
    if (game.hp <= 0) endGame();
}

function endGame() {
    game.active = false;
    clearInterval(spawnTimer);
    
    const resultScreen = document.getElementById('result-screen');
    const title = document.getElementById('result-title');
    const desc = document.getElementById('result-desc');
    
    resultScreen.style.display = 'flex';
    document.getElementById('final-score').innerText = game.score;

    if (game.score >= 1500) {
        title.innerText = "MISSION PERFECT! 💎";
        desc.innerText = "You have successfully protected the glacier! You are a true environmental expert.";
    } else if (game.score >= 700) {
        title.innerText = "MISSION SUCCESS! 🏔️";
        desc.innerText = "Great job! You saved the glacier from Black Carbon. Keep up the good work!";
    } else {
        title.innerText = "MISSION FAILED... 😷";
        desc.innerText = "The glacier is melting rapidly. Would you like to try again to save our planet?";
    }

    saveRank();
    showRanks();
}

function saveRank() {
    let rks = JSON.parse(localStorage.getItem('ggc_final_rk_en') || '[]');
    rks.push({n: game.name, s: game.score});
    rks.sort((a,b) => b.s - a.s);
    localStorage.setItem('ggc_final_rk_en', JSON.stringify(rks.slice(0, 5)));
}

function showRanks() {
    const rks = JSON.parse(localStorage.getItem('ggc_final_rk_en') || '[]');
    const list = document.getElementById('rank-list');
    list.innerHTML = rks.map((r, i) => `
        <div class="rk-item">
            <span>${i+1}. ${r.n}</span>
            <b style="color:#00ffcc">${r.s}</b>
        </div>
    `).join('') || "No records yet.";
}
