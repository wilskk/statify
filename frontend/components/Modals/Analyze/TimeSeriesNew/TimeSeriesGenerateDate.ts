export async function generateDate(
    periodicity: number,
    typeDate: string,
    startDate: number,
    dataLength: number,
): Promise<string[]>{
    let dateArray: string[] = [];
    switch (typeDate) {
        case "y":
            for (let i = 0; i < dataLength; i++) {
                dateArray.push((startDate + i).toString());
            }
            break;
        case "ys":
            for (let i = 0; i < dataLength; i++) {
                const year = startDate + Math.floor((i) / 2);
                const semester =  i % 2 + 1;
                dateArray.push(`${year}S${semester}`);
            }
            break;
        case "yq":
            for (let i = 0; i < dataLength; i++) {
                const year = startDate + Math.floor((i) / 4);
                const quarter = i % 4 + 1;
                dateArray.push(`${year}Q${quarter}`);
            }
            break;
        case "ym":
            for (let i = 0; i < dataLength; i++) {
                const year = startDate + Math.floor((i) / 12);
                const quarter = i % 12 + 1;
                dateArray.push(`${year}M${quarter}`);
            }
            break;
        case "wwd5": case "wwd6": case "wd":
            for (let i = 0; i < dataLength; i++) {
                const week = startDate + Math.floor((i) / periodicity);
                const day = (startDate + i) % periodicity + 1;
                dateArray.push(`W${week}D${day}`);
            }
            break;
        case "dwh": case "dh":
            for (let i = 0; i < dataLength; i++) {
                const day = startDate + Math.floor((i) / periodicity);
                const hour = (startDate + i) % periodicity + 1;
                dateArray.push(`D${day}H${hour}`);
            }
            break;
    }
    return dateArray;
}