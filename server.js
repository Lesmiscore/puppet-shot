const express = require("express");
const ss = require("./index");
const $ = require("cheerio");
const fs = require("fs");
const crypto = require("crypto");
const cache = {};

const sites = "./sites.json";

const passwordHashed = "a3c346e8c68f8e17229df84b945e402eedf304225a9bb063ffe8078e951e06f8";

function getArray() {
    if (fs.existsSync(sites)) {
        return JSON.parse(fs.readFileSync(sites));
    } else {
        return ["https://google.com/", "https://yahoo.co.jp/", "https://youtube.com/", "https://hosyusokuhou.jp/", "http://jin115.com/"];
    }
}

function setArray(array) {
    try {
        fs.writeFileSync(sites, JSON.stringify(array));
    } catch (e) {}
}

function addSite(_url) {
    const url = _url + "";
    const array = getArray();
    array.push(url);
    setArray(array);
}

function removeSite(_url) {
    const url = _url + "";
    const array = getArray();
    if (array.indexOf(url) >= 0) {
        array.splice(array.indexOf(url), 1);
    }
    setArray(array);
}

function fromHex(a) {
    return Buffer.from(a, "hex").toString("utf8");
}

function toHex(a) {
    return Buffer.from(a, "utf8").toString("hex");
}

function testPassword(_str) {
    const str = _str + "";
    const sha256 = crypto.createHash("sha256");
    sha256.update(str);
    return passwordHashed == sha256.digest("hex");
}

function shotRoutine() {
    const requested = getArray();
    ss(requested, {
        longShot: true
    }).then(function (values) {
        for (let key in values) {
            cache[requested[key]] = values[key];
        }
    }).catch(a => {
        console.log(a);
        shotRoutine();
    });
}
shotRoutine();
setInterval(shotRoutine, 300000);

const app = express();
app.get("/", function (req, resp) {
    const body = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Automated screenshot</title>
</head>
<body>
`;
    const tail = `
</body>
</html>
`;
    let inside = "";
    if (!cache) {
        inside = "<p>There is no cache right now. Check it back later.</p>";
    } else {
        for (let key in cache) {
            const name = toHex(key);
            inside += `<a href="/image/${name}">${key}</a><br />`;
        }
    }
    resp.send(body + inside + tail);
});

app.get("/image/:name", function (req, resp) {
    const key = fromHex(req.params.name);
    const data = cache[key];
    if (!data) {
        resp.sendStatus(404);
        return;
    }
    resp.type(".png").send(data);
});

app.get("/manage/add/:url/:password", function (req, resp) {
    if (!testPassword(req.params.password)) {
        resp.sendStatus(404);
        return;
    }
    addSite(fromHex(req.params.url));
    resp.send("OK");
});


app.get("/manage/del/:url/:password", function (req, resp) {
    if (!testPassword(req.params.password)) {
        resp.sendStatus(404);
        return;
    }
    removeSite(fromHex(req.params.url));
    resp.send("OK");
});

app.listen(3040);