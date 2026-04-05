//инициализация канваса
let canvas;
let context;
canvas = document.getElementById('canvas');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
context = canvas.getContext('2d');

//создание точек
let points = [];
function makeDot(x, y) {
    x = Number(x);
    y = Number(y);
    return {x, y};
}

//евклидово расстояние
function distanse(dot1, dot2){
    return Math.sqrt(Math.pow(dot1.x-dot2.x, 2)+Math.pow(dot1.y-dot2.y, 2));
}

//k-средних
function kMeans(points, k){
    let n = points.length;
    let centroids = new Array(k);
    let labels = new Array(n).fill(-1);

    //первый центр выбирает случайно
    let randIndex = Math.floor(Math.random() * n);
    centroids[0] = { x: points[randIndex].x, y: points[randIndex].y };
    newCenter(n, k, points, centroids); //назначение ост. центров

    //все нижеперечисленное повторяется 200раз/пока центры не перестанут меняться
    let changed;
    for (let count = 0; count < 200; count++) {
        changed = false;

        //каждая точка к ближайшему центру
        for (let i = 0; i < n; i++) {
            let minDist = Number.MAX_VALUE;
            let bestCluster = -1;

            for (let j = 0; j < k; j++) {
                let dist = distanse(points[i], centroids[j]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = j;
                }
            }

            //смена кластера у точки
            if (labels[i] !== bestCluster) {
                labels[i] = bestCluster;
                changed = true;
            }
        }

        if (!changed) break;

        //новые центры
        let newCentroids = [];
        for (let i = 0; i < k; i++) {
            newCentroids.push({ x: 0, y: 0 });
        }
        let count = new Array(k).fill(0);

        for (let i = 0; i < n; i++) {
            newCentroids[labels[i]].x += points[i].x;
            newCentroids[labels[i]].y += points[i].y;
            count[labels[i]]++;
        }

        for (let j = 0; j < k; j++) {
            if (count[j] > 0){
                centroids[j].x = newCentroids[j].x/count[j];
                centroids[j].y = newCentroids[j].y/count[j];
            }
        }
    }

    return {labels: labels};
}
function newCenter(n, k, points, centroids){
    for (let i = 1; i < k; i++) {
        let distances = new Array(n).fill(0);
        let totalDist = 0;

        //расстояния до выбранного центра
        for (let j = 0; j < n; j++) {
            let minDist = Number.MAX_VALUE;
            for (let k = 0; k < i; k++) {
                let dist = distanse(points[j], centroids[k]);
                minDist = Math.min(dist, minDist);
            }
            distances[j] = Math.pow(minDist, 2);
            totalDist += distances[j];
        }

        //выбор новых центров
        let r = Math.floor(Math.random() * totalDist);
        let cumulative = 0;
        for (let j = 0; j < n; j++) {
            cumulative+= distances[j];
            if (cumulative>=r){
                centroids[i] = {x:points[j].x, y:points[j].y};
                break;
            }
        }
    }
}

function DBSCAN(d, eps, minPts){
    let visited = new Array(d.length).fill(false);
    let pointCls = new Array(d.length).fill(undefined);

    let c = 0;

    //перебираем непосещенные точки
    for (let i = 0; i<d.length; i++){
        if (visited[i]){continue;}
        visited[i] = true;

        let neighborPts = regionQuery(d, i, eps); //ищем соседей у каждой точки
        if (neighborPts.length<minPts){
            pointCls[i] = -1;
        }//если соседей нет - точка-шум, иначе расширяем кластер
        else{
            expandCluster(d, i, eps, neighborPts, visited, minPts, pointCls, c);
            c++;
        }
    }
    console.log(Array.from(pointCls.values()));
    return {labels: Array.from(pointCls.values())};
}
//добавляем соседей в кластер
function expandCluster(d, i, eps, neighborPts, visited, minPts, pointCls, c){
    pointCls[i] = c;

    for (let i = 0; i<neighborPts.length; i++){
        let q = neighborPts[i];
        //непосещенных соседей т. добавляем
        if (!visited[q]){
            visited[q] = true;
            let qNeighborPts = regionQuery(d, q, eps);//и их соседей тоже
            if (qNeighborPts.length >= minPts){
                for (let newp of qNeighborPts) {
                    if (!neighborPts.includes(newp)) {
                        neighborPts.push(newp);
                    }
                }
            }
        }
        //если т. не шум и не принадлежит др. кластеру - добавляем
        if(pointCls[q] === undefined || pointCls[q] === -1){
            pointCls[q] = c;
        }
    }
}
function regionQuery(d, p, eps){
    let neighbors = [];
    for (let i = 0; i < d.length; i++){
        if(distanse(d[i], d[p]) <= eps){
            neighbors.push(i);
        }
    }//если расстояние до перебираемых точек <eps - сосед
    return neighbors;
}


function aglomerativ(k, points){
    let clasters = new Array();
    for (let i = 0; i < points.length; i++) clasters[i] = [points[i]]; //каждая т. - кластер

    //пока кластеров больше требуемого - сливаем ближайшие
    while (clasters.length > k) {
        let minDist = Number.MAX_VALUE;
        let minPair = [0, 1];
        for (let i = 0; i < clasters.length; i++) {
            for (let j = i+1; j < clasters.length; j++) {
                let wardDist = ward(clasters[i], clasters[j])
                if (wardDist < minDist) {
                    minDist = wardDist;
                    minPair = [i, j];
                }
            }
        }
        let [a, b] = minPair;
        clasters[a] = clasters[a].concat(clasters[b]);
        clasters.splice(b, 1);
    }

    //инициализация кластеров и присвоение им точек
    let labels = new Array(points.length);
    for (let i = 0; i < clasters.length; i++) {
        for (let p of clasters[i]) {
            let index = points.indexOf(p);
            labels[index] = i;
        }
    }

    return {labels: labels};
}
//расстояние между ближайшими кластерами (м. Уорда)
function ward(c1, c2){
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i of c1){
        x1+=i.x; y1+=i.y;
    }
    for (let i of c2){
        x2+=i.x; y2+=i.y;
    }//центры кластеров

    x1 = x1/c1.length; x2 = x2/c2.length;
    y1 = y1/c1.length; y2 = y2/c2.length;
    let c1d = {x:x1, y:y1}; let c2d = {x:x2, y:y2};//центры масс.
    let dist = distanse(c1d, c2d);

    let wardDist = (c1.length*c2.length)/(c1.length+c2.length)*dist*dist;
    return wardDist;
}


//рисование точек
canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    draw(x, y, 'white');
    points.push(makeDot(x, y));
});
function draw(x, y, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI*2);
    context.fill();
}

//запуск к-средних
function runKMeans() {
    let k = parseInt(document.getElementById('genKlast').value) || 3;
    let res = kMeans(points, k);
    let {labels} = res;

    let colors = ['Crimson', 'HotPink', 'SlateBlue', 'DarkBlue', 'SteelBlue', 'Indigo', 'Salmon', 'LightSeaGreen', 'SandyBrown', 'DarkSlateGray'];

    for (let i = 0; i < points.length; i++) {
        draw(points[i].x, points[i].y, colors[labels[i] % colors.length]);
    }
}

//запуск DBSCAN
function runDBSCAN() {
    let eps = 60;
    let minPts = parseInt(document.getElementById('genCPoints').value) || 3;
    let res = DBSCAN(points, eps, minPts);
    let {labels} = res;
    let colors = ['Crimson', 'HotPink', 'SlateBlue', 'DarkBlue', 'SteelBlue', 'Indigo', 'Salmon', 'LightSeaGreen', 'SandyBrown', 'DarkSlateGray'];
    console.log(labels)
    for (let i = 0; i < points.length; i++) {
        if (labels[i] === -1) {
            draw(points[i].x, points[i].y, 'gray');
        } else {
            draw(points[i].x, points[i].y, colors[labels[i] % colors.length]);
        }
    }
}

//запуск агломеративного
function runAglomerativ() {
    let k = parseInt(document.getElementById('genKlastAl').value) || 3;
    let res = aglomerativ(k, points);
    let {labels} = res;

    let colors = ['Crimson', 'HotPink', 'SlateBlue', 'DarkBlue', 'SteelBlue', 'Indigo', 'Salmon', 'LightSeaGreen', 'SandyBrown', 'DarkSlateGray'];

    for (let i = 0; i < points.length; i++) {
        draw(points[i].x, points[i].y, colors[labels[i] % colors.length]);
    }
}

//генерация случайных точек
function randomPointInCanvas() {
    return makeDot(
        Math.random() * canvas.width,
        Math.random() * canvas.height
    );
}
function generateRandomPoints() {
    let numPoints = parseInt(document.getElementById('genCount').value) || 50;
    clear();
    for (let i = 0; i < numPoints; i++) {
        let pt = randomPointInCanvas();
        points.push(pt);
        draw(pt.x, pt.y, 'white');
    }
}

//"очистить"
document.getElementById("clear").onclick = clear;
function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.length = 0;
}
