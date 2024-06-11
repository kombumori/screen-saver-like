import type { Component } from 'solid-js';
import { createSignal, createEffect, onMount } from 'solid-js';
import { select, area, curveCatmullRom } from 'd3';

type FixedLengthArray<T, N extends number, A extends any[] = []> = A extends { length: N } ? A : FixedLengthArray<T, N, [ ...A, T ]>;

class PointsManager<T extends [number, number][], U extends number[]> {
    pointsYRange: T;
    pointsKeyFrame: U[];
    currentKeyFrameIndex: number;
    currentIndices: number[];

    constructor(pointsYRange: T, pointsFirstKeyFrame: U) {
        this.pointsYRange = pointsYRange;
        this.pointsKeyFrame = [];
        this.currentKeyFrameIndex = 0;
        this.currentIndices = Array(pointsFirstKeyFrame.length).fill(0);

        pointsFirstKeyFrame.forEach((currentY, i) => {
            const nextY = this.generateNextY(i);
            this.pointsKeyFrame[i] = this.generateConsecutiveArray(currentY, nextY) as U;
        });
    }

    private generateNextY(index: number): number {
        const min = this.pointsYRange[index][0];
        const max = this.pointsYRange[index][1];
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private generateConsecutiveArray(m: number, n: number): number[] {
        return Array.from({ length: Math.abs(n - m) + 1 }, (_, i) => m < n ? m + i : m - i);
    }

    generateNextPoints(): U {
        const result: number[] = [];
        for (let i = 0; i < this.pointsKeyFrame.length; i++) {
            if (this.currentIndices[i] >= this.pointsKeyFrame[i].length) {
                const lastY = this.pointsKeyFrame[i][this.pointsKeyFrame[i].length - 1];
                const nextY = this.generateNextY(i);
                this.pointsKeyFrame[i] = this.generateConsecutiveArray(lastY, nextY) as U;
                this.currentIndices[i] = 0;
            }
            result.push(this.pointsKeyFrame[i][this.currentIndices[i]]);
            this.currentIndices[i]++;
        }
        return result as U;
    }
}



const BackGround: Component<{class?: string}> = (props) => {
  type Point = { x: 0 | 200 | 400 | 600 | 800 | 1000, y: number }
  type PointsYRange = FixedLengthArray<[number, number], 6>
  type Points = FixedLengthArray<Point, 6>
  type KeyFrame = FixedLengthArray<number, 6>

  const pointsRedYRange: PointsYRange = [
    [1600, 2000],
    [1400, 1800],
    [1200, 1600],
    [600, 1000],
    [400, 800],
    [1000, 1400]
  ]

  const pointsBlueYRange: PointsYRange = [
    [500, 900],
    [700, 1100],
    [1000, 1400],
    [1200, 1600],
    [1400, 1800],
    [1600, 2000]
  ]

  const firstRedPoints: Points = [
      { x: 0, y: 1800 },
    { x: 200, y: 1600 },
    { x: 400, y: 1400 },
    { x: 600, y: 800 },
    { x: 800, y: 600 },
    { x: 1000, y: 1200 }
  ]

  const firstBluePoints: Points = [
    { x: 0, y: 700 },
  { x: 200, y: 900 },
  { x: 400, y: 1200 },
  { x: 600, y: 1400 },
  { x: 800, y: 1600 },
  { x: 1000, y: 1800 }
  ]

  let svgRef: SVGSVGElement | undefined;

  const [redPoints, setRedPoints] = createSignal<Points>(firstRedPoints);

  const [bluePoints, setBluePoints] = createSignal<Points>(firstBluePoints);

  const areaGenerator = area<{ x: number, y: number }>()
    .curve(curveCatmullRom)
    .x(d => d.x)
    .y1(d => d.y)
    .y0(2000); 

  createEffect(() => {
    const svg = select(svgRef!);
    svg.selectAll('*').remove(); 

    const linearRedGradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'redGrad')
        .attr('gradientTransform', 'rotate(90)');

    const linearBlueGradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'blueGrad')
        .attr('gradientTransform', 'rotate(90)');
  
    const feGaussianBlur = svg.append('defs')
        .append('filter')
        .attr('id', 'blur')
        .append('feGaussianBlur')
        .attr('stdDeviation', '70');
  
    linearRedGradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', 'orange');
  
    linearRedGradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', 'red');

    linearBlueGradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', 'skyblue');
  
    linearBlueGradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', 'blue');

    svg.append('path')
        .datum(bluePoints())
        .attr('d', areaGenerator)
        .style('fill', 'url(#blueGrad)')
        .style('filter', 'url(#blur)');
  
    svg.append('path')
        .datum(bluePoints())
        .attr('d', areaGenerator)
        .style('fill', 'url(#blueGrad)');

    svg.append('path')
        .datum(redPoints())
        .attr('d', areaGenerator)
        .style('fill', 'url(#redGrad)')
        .style('filter', 'url(#blur)');
  
    svg.append('path')
        .datum(redPoints())
        .attr('d', areaGenerator)
        .style('fill', 'url(#redGrad)');
  });

  onMount(() => {
    let currentRedPoints = firstRedPoints
    const firstRedKeyFrame = firstRedPoints.map( (point: Point) => point.y ) as KeyFrame
    const redPointsManager = new PointsManager<PointsYRange, KeyFrame>( pointsRedYRange, firstRedKeyFrame)
    
    let currentBluePoints = firstBluePoints
    const firstBlueKeyFrame = firstBluePoints.map( (point: Point) => point.y ) as KeyFrame
    const bluePointsManager = new PointsManager<PointsYRange, KeyFrame>( pointsBlueYRange, firstBlueKeyFrame)

    setInterval(() => {

        const newRedKeyFrame: KeyFrame = redPointsManager.generateNextPoints()
        currentRedPoints = currentRedPoints.map( (point: Point, i) => ({ x: point.x, y: newRedKeyFrame[i]})) as Points
        setRedPoints(currentRedPoints)

        const newBlueKeyFrame: KeyFrame = bluePointsManager.generateNextPoints()
        currentBluePoints = currentBluePoints.map( (point: Point, i) => ({ x: point.x, y: newBlueKeyFrame[i]})) as Points
        setBluePoints(currentBluePoints)

    }, 8)
  })

  return <svg ref={svgRef} viewBox="0 0 1000 2000" preserveAspectRatio="none" {...props}></svg>;
};

export default BackGround;
