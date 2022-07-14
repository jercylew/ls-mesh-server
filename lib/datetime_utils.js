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

module.exports = { todayDate };

