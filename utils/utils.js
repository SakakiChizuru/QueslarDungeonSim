export function costOfLvl(lvl) {
    return (lvl * (lvl + 1) / 2) * 10000;
}

export function costOfLvlRaise(startingLvl, lvlIncrease) {
    return costOfLvl(startingLvl + lvlIncrease) - costOfLvl(startingLvl);
}

export function millify(n) {
    if (typeof n === 'number' && !Number.isFinite(n)) {
        throw new Error('Invalid number');
    }

    if (typeof n === 'string') {
        const num = Number(n);
        if (!Number.isNaN(num)) n = num;
    }

    if (n < 0) {
        return '-' + millify(-n);
    }

    if (n < 1000) {
        if (Number.isInteger(n)) {
            return String(n);
        } else {
            if (Number.isInteger(Math.trunc(n))) {
                return String(Math.trunc(n));
            } else {
                return parseFloat(n.toFixed(2)).toString();
            }
        }
    } else {
        const millnames = ['', 'k', 'm', 'b', 't', 'qa', 'qi', 'sx', 'sp'];
        const maxIndex = millnames.length - 1;
        const thousands = Math.floor(Math.log10(n) / 3);
        const millidx = Math.max(0, Math.min(maxIndex, thousands));
        let formattedNumber = (n / 10 ** (3 * millidx)).toFixed(2);
        if (formattedNumber.endsWith('.00')) {
            formattedNumber = formattedNumber.slice(0, -1);
        }
        return `${formattedNumber}${millnames[millidx]}`;
    }
}

export function demillify(n) {
    if (typeof n === 'number') return n;

    if (typeof n === 'string' && !/[a-zA-Z]/.test(n)) {
        if (n.includes('.')) return parseFloat(n);
        return parseInt(n, 10);
    }

    if (typeof n !== 'string') {
        throw new Error(`Number format ${n} not recognized`);
    }

    const lower = n.toLowerCase();
    if (lower.endsWith('k')) return parseFloat(lower.slice(0, -1)) * 1e3;
    if (lower.endsWith('m')) return parseFloat(lower.slice(0, -1)) * 1e6;
    if (lower.endsWith('b')) return parseFloat(lower.slice(0, -1)) * 1e9;
    if (lower.endsWith('t')) return parseFloat(lower.slice(0, -1)) * 1e12;
    if (lower.endsWith('qa')) return parseFloat(lower.slice(0, -2)) * 1e15;
    if (lower.endsWith('qi')) return parseFloat(lower.slice(0, -2)) * 1e18;
    if (lower.endsWith('sx')) return parseFloat(lower.slice(0, -2)) * 1e21;
    if (lower.endsWith('sp')) return parseFloat(lower.slice(0, -2)) * 1e24;
    throw new Error(`Number format ${n} not recognized`);
}

export function calculateDefense(defense) {
    const capped = Math.min(20000, defense);
    return Math.min(1 - 1 / Math.pow(1 + (defense + capped * 9) / 50000, 0.25), 0.95);
}


