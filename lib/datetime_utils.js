const numToPaddedText = (num) => {
    return num > 9 ? num.toString() : ('0' + num);
};

const todayDate = () => {
    let dtNow = new Date();
    let y = dtNow.getFullYear();
    let m = (dtNow.getMonth() + 1);
    let d = dtNow.getDate();
    return `${numToPaddedText(y)}-${numToPaddedText(m)}-${numToPaddedText(d)}`;
};

const dateToDateTimeString = (date) => {
    let strDate = '';

    if (date === null || date === undefined) {
        return strDate;
    }

    if (typeof date === 'string') {
        date = new Date(date);
    }

    const y = date.getFullYear();
    const mt = (date.getMonth() + 1);
    const day = date.getDate();
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();

    strDate = y + "-" + numToPaddedText(mt) + "-" +
        numToPaddedText(day) + " " + numToPaddedText(h) + ":"
        + numToPaddedText(m) + ":" + numToPaddedText(s);
    return strDate;
};


module.exports = { todayDate, dateToDateTimeString };

