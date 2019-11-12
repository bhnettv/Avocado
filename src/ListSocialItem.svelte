<script>
export let channel = undefined;
export let endpoint = undefined;

let mapping = {
  'blog': 'Blog',
  'dev': 'Dev.to',
  'github': 'GitHub',
  'medium': 'Medium',
  'reddit': 'Reddit',
  'stackoverflow': 'Stack Overflow',
  'twitter': 'Twitter',
  'website': 'Website',
  'youtube': 'YouTube'
};
</script>

<style>
div {
  display: flex;
  flex-direction: row;
}

p {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 46px;
  line-height: 46px;
  margin: 0;
  padding: 0 16px 0 32px;
}

p.channel {
  width: 160px;
}

p.endpoint {
  flex-grow: 1; 
  padding: 0 16px 0 11px;
}
</style>

<div>
  <p class="channel">{mapping[channel]}</p>
  <p class="endpoint">{endpoint}</p>
</div>
