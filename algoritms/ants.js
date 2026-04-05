//канвас, таймер, инициализация точек, констант
let canvas;
let context;
canvas = document.getElementById('canvas');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
context = canvas.getContext('2d');
let startTime = 0;
let timerInterval = null;
let points = [];

function makeDot(x, y) {
    x = Number(x);
    y = Number(y);
    return {x, y};
}

const alpha = 9.0;
const beta = 5.0;
const p = 0.7;
let q;

//граф, добавляет ребра и матрицу смежности
class graph{
    constructor(vertexCount) {
        this.adjacencyMatrix = Array.from({ length: vertexCount }, () =>
            Array(vertexCount).fill(0)
        );
    }
    addEdge(from, to, weight) {
        this.adjacencyMatrix[from][to] = weight;
    }
    getMatrix() {
        return this.adjacencyMatrix;
    }
}

//класс результата
class res{
    constructor(vert, dist) {
        this.vert = vert;
        this.dist = dist;
    }
}

function TSP(graph) {
    //матрица смежности, колчество точек, массив феромонов, изменения феромонов, минимальная длина пути, лучшии путь
    let distanceMatrix = graph.getMatrix();
    let n = distanceMatrix.length;
    q = 5*n;
    let pheromones = new Array();
    let deltaPheromones  = new Array();
    for (let i = 0; i < n; i++) {
        pheromones[i] = [];
        deltaPheromones[i] = [];
        for (let j = 0; j < n; j++) {
            pheromones[i][j] = 1;
            deltaPheromones[i][j] = 0;
        }
    }
    let minDist = Number.MAX_VALUE;
    let bestPath = new Array();

    //перебираает 100 раз каждого муравья
    for (let i = 0; i < 500; i++) {
        for (let ant = 0; ant < n; ant++) {
            //отслеживает путь и стартовые вершины муравьев
            let visited = new Array(n).fill(false);
            let currCity = ant;
            visited[currCity] = true;
            let path = [currCity];

            //посещает все в-ы, отмечает оптимальные
            while(path.length < n){
                let probabilites = calculateProbabilities(pheromones, distanceMatrix, currCity, visited, n);
                let nextCity = selectNextVertex(probabilites);
                visited[nextCity] = true;
                path.push(nextCity);
                currCity = nextCity;
            }
            path.push(path[0]);

            let l = calculatePathLength(path, distanceMatrix);//длина пути

            if (l<minDist) {
                minDist = l;
                bestPath = [...path];
            }//обновление длины лучшего пути и сам путь

            updateDeltaPheromones(deltaPheromones, path, l);//обн. феромоны
        }

        evaporatePheromones(pheromones, p);//феромоны все
        addNewTrails(pheromones, deltaPheromones, p);//новые феромоны

    }
    return new res(bestPath, minDist);
}

//обновляет феромоны
function updateDeltaPheromones(deltaPheromones, path, l) {
    for (let i = 0; i < path.length-1; i++) {
        let from = path[i];
        let to = path[i+1];
        deltaPheromones[from][to] += q/l;//чем короче путь - тем больше ф-н
    }
}

//испаряет феромоны
function evaporatePheromones(pheromones, p) {
    for (let i = 0; i < pheromones.length; i++) {
        for (let j = 0; j < pheromones[i].length; j++) {
            pheromones[i][j] *= (1 - p);//умножаем на коэф испарения
        }
    }
}

//новые феромоны
function addNewTrails(pheromones, deltaPheromones, p) {
    for (let i = 0; i < pheromones.length; i++) {
        for (let j = 0; j < pheromones[i].length; j++){
            pheromones[i][j] += deltaPheromones[i][j] * p; //доб-м новые ф-ы
        }
    }
}

//длина пути
function calculatePathLength(path, distanceMatrix) {
    let l = 0.0;
    for (let i = 0; i < path.length-1; i++) {
        let from = path[i];
        let to = path[i+1];
        l += distanceMatrix[from][to];
    }
    l += distanceMatrix[path[path.length-1]][path[0]];
    return l;
}

//вероятность перехода в др. точку
function calculateProbabilities(pheromones, distanceMatrix, currentCity, visited, n) {
    let probabilities = new Array(n).fill(0);
    let sum = 0.0

    //вероятности непосещенных городов
    for (let i = 0; i < n; i++) {
        if (!visited[i]) {
            probabilities[i] = Math.pow(pheromones[currentCity][i], alpha) * Math.pow(1.0/distanceMatrix[currentCity][i], beta)
            sum += probabilities[i]
        }
    }

    //вероятности в пределах от 0 до 1
    for (let i = 0; i < n; i++) {
        probabilities[i] /= sum
    }

    return probabilities;
}

//выбор точки
function selectNextVertex(probabilities) {
    let sm = 0.0;
    let beg = new Array(probabilities.length).fill(0);
    let end = new Array(probabilities.length).fill(0);

    //суммируем вероятности
    for (let i=0; i<probabilities.length; i++) {
        sm += probabilities[i];
    }

    //интервалы вероятностей
    let c = 0.0;
    for (let i = 0; i<probabilities.length; i++) {
        beg[i] = c
        end[i] = c + probabilities[i]/sm
        c = end[i]
    }

    //выбор города с помощью случайного числа и интервалов
    let m = Math.random();
    for (let i = 0; i<probabilities.length; i++) {
        if (beg[i] <= m && end[i] >= m) {
            return i;
        }
    }

    return probabilities.length - 1;
}

//точки кликами
canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    draw(x, y, 'white');
    points.push(makeDot(x, y));
    context.clearRect(0, 0, canvas.width, canvas.height);
    redrawPoints();
});
function redrawPoints() {
    for (let point of points) {
        draw(point.x, point.y, 'HotPink');
    }
}
function draw(x, y, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, 7, 0, Math.PI*2);
    context.fill();
}

//запуск алг-а
function runAnts() {
    if (points.length < 2) return;
    startTimer()//старт таймера
    let g = new graph(points.length);

    //инициализация графа
    for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < points.length; j++) {
            if (i !== j) {
                let dx = points[i].x - points[j].x;
                let dy = points[i].y - points[j].y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                g.addEdge(i, j, dist);
            }
        }
    }

    drawAllEdges(g, points);

    let res = TSP(g);
    let bestPath = res.vert;
    let distance = res.dist;

    //отрисовки линий
    context.beginPath();
    let firstPoint = points[bestPath[0]];
    context.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < bestPath.length; i++) {
        let point = points[bestPath[i]];
        context.lineTo(point.x, point.y);
    }

    context.lineTo(firstPoint.x, firstPoint.y);
    context.closePath();

    context.strokeStyle = 'HotPink';
    context.lineWidth = 5;
    context.stroke();
    stopTimer(distance);
}

//отрисовка всех путей
function drawAllEdges(graph, points) {
    let matrix = graph.getMatrix();
    context.strokeStyle = 'white';
    context.lineWidth = 1;

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (i !== j && matrix[i][j] > 0) {
                context.beginPath();
                context.moveTo(points[i].x, points[i].y);
                context.lineTo(points[j].x, points[j].y);
                context.stroke();
            }
        }
    }
}

//рандомные точки
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

//таймер старт
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const now = Date.now();
        const seconds = ((now - startTime) / 1000).toFixed(2);
        document.getElementById('timer').innerText = `⏱️ Время: ${seconds} сек`;

    }, 100);
}
//таймер стоп
function stopTimer(distance) {
    clearInterval(timerInterval);
    const now = Date.now();
    const seconds = ((now - startTime) / 1000).toFixed(2);
    document.getElementById('timer').innerText = `⏱️ Время: ${seconds} сек 📏 Длина пути: ${distance.toFixed(2)}`;
}

//"очистить"
document.getElementById("clear").onclick = clear;
function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.length = 0;
    clearInterval(timerInterval);
    document.getElementById('timer').innerText = '';
}