<script>
import Highcharts from 'highcharts';

export let data = [{
  name: 'Blog',
  y: 5
}, {
  name: 'Dev.to',
  y: 6
}, {
  name: 'GitHub',
  y: 59
}, {
  name: 'Medium',
  y: 2
}, {
  name: 'Reddit',
  y: 4.18
}, {
  name: 'SO',
  y: 7.05
}, {
  name: 'Twitter',
  y: 7.05
}, {
  name: 'YouTube',
  y: 7.05
}];
export let series = 'Channels';
export let title = null;

let chart = undefined;
let container = undefined;

function doClick( evt ) {
  chart = Highcharts.chart( container, {
    chart: {
      align: 'left',
      backgroundColor: '#f3f3f3',
      plotBackgroundColor: '#f3f3f3',
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    colors: [
      '#663bc2', '#4191e0', '#286060', '#942950', '#e85959', '#500d0c'
    ],
    credits: false,
    title: {
      verticalAlign: 'middle',
      y: 60,
      text: '123<br>' + title,
      style: {
        color: '#393939',
        fontSize: '14px',
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontWeight: 600,
        margin: 0
      }
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:0.1f}%</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: false,
        startAngle: -90,
        endAngle: 90,
        center: ['50%', '75%'],
        size: '120%'
      }
    }
  } );

  chart.addSeries( {
    name: series,
    colorByPoint: true,
    innerSize: '50%',
    data: data
  } );
}
</script>

<style>
div {
  background-color: #f3f3f3;
  flex-basis: 0;
  flex-grow: 1;
}
</style>

<div bind:this="{container}" on:click="{doClick}"></div>
