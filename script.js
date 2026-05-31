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

let game = { hp: 100, score: 0, level: 1, speed: 2.5, rate: 1200, isOver: false, name: "" };
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
    
    // 적 생성 주기 시작
    spawnTimer = setInterval(spawn, game.rate);
    requestAnimationFrame(animate);
}

function spawn() {
    if(game.isOver) return;
    
    const enemy = document.createElement('div');
    enemy.className = 'black-carbon';
    // 화면 너비에 맞춰 랜덤 위치 생성
    const maxX = window.innerWidth - 60;
    enemy.style.left = Math.random() * maxX + 'px';
    enemy.style.top = '-60px';
    
    // [중요] 클릭 및 터치 이벤트 둘 다 대응
    const handleHit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if(game.isOver) return;
        
        game.score += 10;
        document.getElementById('score-text').innerText = game.score;
        enemy.remove();
        
        // 100점마다 난이도 상승
        if(game.score > 0 && game.score % 100 === 0) {
            game.level++;
            game.speed += 0.4;
            document.getElementById('level-num').innerText = game.level;
        }
    };

    enemy.addEventListener('mousedown', handleHit);
    enemy.addEventListener('touchstart', handleHit);
    
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

        // 빙하에 충돌했을 때
        if(top + 50 > glacierTop) {
            enemy.remove();
            game.hp -= 20; // 체력 차감
            document.getElementById('hp-fill').style.width = Math.max(0, game.hp) + "%";
            
            if(game.hp <= 0) endGame();
        }
    }
    requestAnimationFrame(animate);
}

async function endGame() {
    if(game.isOver) return;
    game.isOver = true;
    clearInterval(spawnTimer);
    
    document.getElementById('result-screen').style.display = 'flex';
    document.getElementById('final-score').innerText = game.score;
    
    try {
        // 랭킹 저장 (숫자 타입으로 저장)
        await db.collection("rankings").add({
            n: game.name,
            s: Number(game.score),
            t: Date.now()
        });
        showRanks();
    } catch(e) { console.error(e); }
}

async function showRanks() {
    try {
        const snap = await db.collection("rankings").orderBy("s", "desc").limit(5).get();
        const listDiv = document.getElementById('rank-list');
        if(snap.empty) {
            listDiv.innerHTML = "기록이 없습니다.";
            return;
        }
        listDiv.innerHTML = snap.docs.map((doc, i) => `
            <div class="rk-item">
                <span>${i+1}. ${doc.data().n}</span>
                <b>${doc.data().s}</b>
            </div>
        `).join('');
    } catch(e) { 
        document.getElementById('rank-list').innerHTML = "로딩 실패";
    }
}
