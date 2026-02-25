// --- DOM ELEMENTS ---
const reels = document.querySelectorAll('.reel'); 
const spinBtn = document.getElementById('spin_btn');
const balanceText = document.getElementById('balance');
const jackpotText = document.getElementById('jackpot_display');
const statusMsg = document.getElementById('status_msg');
const creditBtn = document.getElementById('credit_btn');
const debtDisplay = document.getElementById('debt_display');

// --- AUDIO ---
const winSound = new Audio('./media/win.mp3');
const cashSound = new Audio('./media/cash.mp3'); 
const spinSound = new Audio('./media/spin.mp3');
const betSound = new Audio('./media/click.mp3'); 

// --- GAME STATE ---
let balance = 1000; 
let jackpotPool = 1000000; 
let spinsRemaining = 0;
let totalDebt = 0; 
let repaymentPerSpin = 0; 
let currentMultiplier = 1; // Default is 1x

const iconHeight = 80; 
const images = ['./img/reel1_.webp', './img/reel2_.webp', './img/reel3_.webp', './img/reel4_.webp', './img/reel5_.webp']; 

// --- UI UPDATER ---
function updateUI() {
    balanceText.innerText = `👛 Wallet: ₹${Math.floor(balance)}`;
    jackpotText.innerHTML = `🤑 ₹${Math.floor(jackpotPool)} 🤑`;
    
    if (debtDisplay) {
        debtDisplay.innerText = totalDebt > 0 ? `Debt: ₹${totalDebt}` : "";
    }

    if (balance < 1000 && totalDebt === 0) {
        creditBtn.disabled = false;
        creditBtn.classList.add('credit-active');
    } else {
        creditBtn.disabled = true;
        creditBtn.classList.remove('credit-active');
    }

    if (spinsRemaining > 0) {
        spinBtn.innerText = `SPIN (${spinsRemaining} LEFT)`;
        spinBtn.disabled = false;
        spinBtn.style.background = "linear-gradient(#ffcc00, #ff9900)";
    } else {
        spinBtn.innerText = "BUY SPINS ABOVE";
        spinBtn.disabled = true;
        spinBtn.style.background = "#555";
    }
}

// --- MULTIPLIER CONTROL ---
window.setMultiplier = function(val) {
    currentMultiplier = val;
    statusMsg.innerText = `Multiplier set to X${val}!`;
    statusMsg.style.color = val > 1 ? "#ff00ff" : "#ffffff";
};

// --- SMART BETTING ---
window.buyBet = function(amount, spins) {
    if (balance >= amount) {
        if (betSound) { betSound.currentTime = 0; betSound.play().catch(() => {}); }
        balance -= amount;
        spinsRemaining += spins; 
        jackpotPool += amount; 
        statusMsg.innerText = "Bet Placed! Good Luck!";
        statusMsg.style.color = "#00ff00";
        updateUI();
    } else {
        let shortfall = amount - balance; 
        let proceed = confirm(`Need ₹${shortfall} more to place this ₹${amount} bet. Take Credit 💳?`);
        
        if (proceed) {
            totalDebt += shortfall; 
            repaymentPerSpin = Math.ceil(totalDebt / 5); 
            balance += shortfall; 
            balance -= amount;
            spinsRemaining += spins;
            jackpotPool += amount;
            
            if (cashSound) cashSound.play().catch(() => {});
            statusMsg.innerText = `₹${shortfall} Credited & ₹${amount} Bet Placed!`;
            statusMsg.style.color = "#00ffff";
            updateUI();
        }
    }
};

// --- CREDIT SYSTEM ---
window.takeCredit = function() {
    if (balance >= 1000 || totalDebt > 0) return;
    let loanNeeded = 1000 - balance; 
    totalDebt = loanNeeded;
    repaymentPerSpin = Math.ceil(totalDebt / 5); 
    jackpotPool -= loanNeeded; 
    balance += loanNeeded; 

    if (cashSound) cashSound.play().catch(() => {});
    statusMsg.innerText = `₹${loanNeeded} Credited! Topped up to ₹1000.`;
    updateUI();
};

// --- TIERED MONEY FLOW ANIMATION ---
function flowMoney(amount) {
    let emoji = "🪙";
    let count = 10;
    if (amount >= 5000) { emoji = ["🎉", "💲", "💵", "🪙"]; count = 40; }
    else if (amount > 500) { emoji = ["💵", "🪙"]; count = 25; }
    else if (amount >= 100) { emoji = "💵"; count = 15; }

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'money-particle';
        particle.style.position = 'fixed';
        particle.innerText = Array.isArray(emoji) ? emoji[Math.floor(Math.random() * emoji.length)] : emoji;
        particle.style.left = (Math.random() * 60 + 20) + "vw"; 
        particle.style.top = "60px";
        document.body.appendChild(particle);

        particle.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${(Math.random() - 0.5) * 100}px, ${window.innerHeight}px) rotate(720deg)`, opacity: 0 }
        ], { duration: Math.random() * 1000 + 1500, easing: 'ease-in' }).onfinish = () => particle.remove();
    }
}

// --- SPIN LOGIC ---
function startSpin() {
    // 1. Check Multiplier requirements
    if (spinsRemaining < currentMultiplier) {
        alert(`Need at least ${currentMultiplier} spins for X${currentMultiplier} mode!`);
        return;
    }

    if (spinSound) { spinSound.currentTime = 0; spinSound.play().catch(() => {}); }

    // 2. Correct Deduction
    spinsRemaining -= currentMultiplier;
    jackpotPool += (50 * currentMultiplier); 
    updateUI();
    
    let results = [];
    let flashCount = 0;
    const totalFlashes = 20;

    const shuffleInterval = setInterval(() => {
        reels.forEach((reel, i) => {
            const sIdx = Math.floor(Math.random() * images.length);
            const iIdx = Math.floor(Math.random() * 6); 
            reel.style.backgroundImage = `url('${images[sIdx]}')`;
            reel.style.backgroundPosition = `0px -${iIdx * iconHeight}px`;
            if (flashCount === totalFlashes - 1) results[i] = { strip: images[sIdx], icon: iIdx };
        });
        
        if (++flashCount >= totalFlashes) {
            clearInterval(shuffleInterval);
            setTimeout(() => checkWin(results), 150);
        }
    }, 80); 
}

// --- WIN LOGIC ---
function checkWin(res) {
    const [r1, r2, r3] = res;
    let win = 0;

    const isJP = (r1.strip === r2.strip && r2.strip === r3.strip && r1.icon === r2.icon && r2.icon === r3.icon);
    const isTwo = ((r1.strip === r2.strip && r1.icon === r2.icon) || (r2.strip === r3.strip && r2.icon === r3.icon) || (r1.strip === r3.strip && r1.icon === r3.icon));

    if (isJP) {
        // --- NEW JACKPOT TIERS ---
        let jpPercent = 0.90; 
        if (currentMultiplier === 3) jpPercent = 0.95; 
        if (currentMultiplier === 5) jpPercent = 0.99; 

        win = Math.floor(jackpotPool * jpPercent);
        jackpotPool *= (1 - jpPercent);
        statusMsg.innerHTML = `🎰 🎉 X${currentMultiplier} JACKPOT: ₹${win} 🎉 🎰`;
        statusMsg.style.color = "#ffcc00";
        if (winSound) winSound.play().catch(() => {});
    } 
    else if (isTwo) {
        // --- MULTIPLIER WIN ---
        let baseWin = Math.floor((jackpotPool * 0.1 / Math.max(spinsRemaining, 1)) * 2);
        win = baseWin * currentMultiplier; 
        statusMsg.innerHTML = `💚 X${currentMultiplier} Match: ₹${win} 💚`;
        statusMsg.style.color = "#00ff00";
    } 
    else {
        // --- LOSS MESSAGES ---
        if (currentMultiplier === 5) {
            win = 0;
            statusMsg.innerHTML = `Bad Luck 🤞 Try harder!<br><small>(₹500 Value Lost)</small>`;
            statusMsg.style.color = "#ff4444";
        } else if (currentMultiplier === 3) {
            win = 0;
            statusMsg.innerHTML = `Better Luck 🍀 Next Time !!<br><small>(₹300 Value Lost)</small>`;
            statusMsg.style.color = "#ff9900";
        } else {
            win = 50; 
            statusMsg.innerText = `Won: ₹50`;
            statusMsg.style.color = "#ffffff";
        }
    }

    if (win > 0) {
        flowMoney(win);
        if (win >= 5000) {
            document.body.classList.add('shake-anim');
            setTimeout(() => {
                alert(`🎊 CONGRATULATIONS! 🎊\nMassive Win of ₹${win}!`);
                document.body.classList.remove('shake-anim');
            }, 500);
        }
    }

    if (totalDebt > 0 && win > 0) {
        let deduction = Math.min(win, repaymentPerSpin, totalDebt);
        win -= deduction;
        totalDebt -= deduction;
        statusMsg.innerHTML += `<br><span style="color:#ff4444; font-size:0.8rem;">(₹${deduction} Paid to Debt)</span>`;
    }

    balance += win;
    updateUI();
}

// --- INITIALIZE & EXTRAS ---
spinBtn.addEventListener('click', startSpin);
updateUI();

window.forceJackpot = function() {
    const originalMathRandom = Math.random;
    Math.random = () => 0; 
    setTimeout(() => { Math.random = originalMathRandom; }, 30000); 
};

window.closeInstructions = function() {
    document.getElementById('instructions_modal').style.display = 'none';
};

window.onload = () => {
    if(document.getElementById('instructions_modal')) {
        document.getElementById('instructions_modal').style.display = 'flex';
    }
};

/*

// --- DEVELOPER TEST TOOL ---
// Call this in the browser console to win the next spin!
window.forceJackpot = function() {
    console.log("🎰 Jackpot Cheat Activated for 30 seconds!");
    const originalMathRandom = Math.random;
    
    // Force every random check to return 0 (top icon on the strip)
    Math.random = () => 0; 
    
    // Automatically reset after 30 seconds so the game returns to normal
    setTimeout(() => { 
        Math.random = originalMathRandom; 
        console.log("🎰 Jackpot Cheat Deactivated.");
    }, 30000); 
};

function closeInstructions() {
    document.getElementById('instructions_modal').style.display = 'none';
}

// Optional: Open instructions automatically when the game loads
window.onload = () => {
    document.getElementById('instructions_modal').style.display = 'flex';
};

// --- NEW GAME STATE ---
let currentMultiplier = 1; // Default is 1x

// Function to set multiplier from UI
window.setMultiplier = function(val) {
    currentMultiplier = val;
    statusMsg.innerText = `Multiplier set to X${val}!`;
    statusMsg.style.color = val > 1 ? "#ff00ff" : "#ffffff";
};


*/