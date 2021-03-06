const fs = require("fs");
const drive = require("drive-db");
const fetch = require('node-fetch');
const { DIR } = require("./constants");

const fetchData = async ({sheet: sheet, tabs: tabs}) => {
    const data = await Promise.all(
        Object.keys(tabs).map(async tab => {
            return {
                [tab]: await drive({ sheet, tab: tabs[tab] })
            };
        })
    );

    let mergedData = {};

    data.forEach(obj => {
        mergedData = { ...mergedData, ...obj };
    });

    return mergedData;
};

const writeData = async ({ file: file, data: data }) => {
    const fileContent = JSON.stringify(sortObjByKey(data),null,"\t");
    if (!fs.existsSync(DIR)) {
        fs.mkdirSync(DIR);
    }
    return fs.writeFileSync(DIR + file, fileContent);
};

const sortObjByKey = (value) => {
    return (typeof value === 'object') ?
        (Array.isArray(value) ?
                value.map(sortObjByKey) :
                Object.keys(value).sort().reduce(
                    (o, key) => {
                        const v = value[key];
                        o[key] = sortObjByKey(v);
                        return o;
                    }, {})
        ) :
        value;
};

const task = async ({ sheet: sheet, tabs: tabs, file: file }) => {
    console.log(`Fetching data from sheet: ${sheet}... tab: ${JSON.stringify(tabs)}`);
    try {
        const data = await fetchData({ sheet, tabs });
        console.log(`Writing data to json file: ${file}...`);
        await writeData({ file, data });
        console.log("Operation completed! Created: " + file);
    } catch (e) {
        console.log(e);
        BOT_TOKEN = process.env.STUCK_BOT;
        CHAT_ID = "-1001363035222";
        var temp_url = "https://api.telegram.org/bot" + BOT_TOKEN +
        "/sendmessage?chat_id="+CHAT_ID+"&text=GitHub Action Failed\n\n"+e+"\n\nhttps://github.com/covid19india/api/actions";
        url = encodeURI(temp_url);
        let settings = { method: "Get" };
        await fetch(url, settings).then(res => res.json())
            .then(json => console.log(json));

        process.exit(1);
    }
};

module.exports = {
    fetchData,
    writeData,
    task
};
