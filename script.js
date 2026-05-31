const firebaseConfig = {
    apiKey: "AIzaSyCGalYZ5WTs4xZiXpUU8XKa9aDZchMzFCM",
    authDomain: "glacier-ranking.firebaseapp.com",
    projectId: "glacier-ranking",
    storageBucket: "glacier-ranking.firebasestorage.app",
    messagingSenderId: "15457584160",
    appId: "1:15457584160:web:d4c7090f026e80b61ca845"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let game = { hp: 100, score: 0, level: 1, speed: 4, rate: 1000, isOver: false, name: "" };
let spawnTimer;

window.onload = () => {
    const saved = localStorage.getItem('glacier-nickname');
    if(saved) document.getElementById('user-name').value = saved;
    showRanks();
};

function startGame() {
    game.name = document.getElementById('user-name').value || "수호자";
    localStorage.setItem('glacier-nickname', game.name);
    document.getElementById('start-screen').style.display = 'none';
    spawnTimer = setInterval(spawn, game.rate);
    requestAnimationFrame(animate);
}

function spawn() {
    if(game.isOver) return;
    const enemy = document.createElement('div');
    enemy.className = 'black-carbon';
    enemy.style.left = Math.random() * (window.innerWidth - 50) + 'px';
    enemy.style.top = '-60px';
    enemy.onclick = (e) => {
        e.stopPropagation();
        if(game.isOver) return;
        game.score += 10;
        document.getElementById('score-text').innerText = game.score;
        enemy.remove();
        checkLevelUp();
    };
    document.getElementById('viewport').appendChild(enemy);
}

function animate() {
    if(game.isOver) return;
    const enemies = document.getElementsByClassName('black-carbon');
    const glacierTop = document.getElementById('glacier').offsetTop;

    for(let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        let top = parseFloat(enemy.style.top) + game.speed;
        enemy.style.top = top + 'px';
        if(top + 40 > glacierTop) {
            enemy.remove();
            game.hp -= 20;
            document.getElementById('hp-fill').style.width = Math.max(0, game.hp) + "%";
            if(game.hp <= 0) endGame();
        }
    }
    requestAnimationFrame(animate);
}

function checkLevelUp() {
    let progress = (game.score % 100);
    document.getElementById('prog-fill').style.width = progress + "%";
    if(game.score > 0 && game.score % 100 === 0) {
        game.level++;
        game.speed += 0.5;
        document.getElementById('level-num').innerText = game.level;
    }
}

async function endGame() {
    if(game.isOver) return;
    game.isOver = true;
    clearInterval(spawnTimer);
    document.getElementById('result-screen').style.display = 'flex';
    document.getElementById('final-score').innerText = game.score;
    try {
        await db.collection("rankings").add({ n: game.name, s: Number(game.score), t: Date.now() });
        showRanks();
    } catch(e) { console.log(e); }
}

async function showRanks() {
    try {
        const snap = await db.collection("rankings").orderBy("s", "desc").limit(5).get();
        document.getElementById('rank-list').innerHTML = snap.docs.map((doc, i) => `
            <div class="rk-item"><span>${i+1}. ${doc.data().n}</span><b>${doc.data().s}</b></div>
        `).join('') || "기록 없음";
    } catch(e) { console.log(e); }
}
