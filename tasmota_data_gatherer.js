const fetch = require('node-fetch');
const fs = require('fs');
const Influx = require('influxdb-v2');
var config = require('./config_influx2');
const db = new Influx.InfluxDB(config.Influx);

async function writeNewDataPoint(i) {
	const res = await fetch('http://' + config.devices[i].ip + '/cm?cmnd=status%208');
	const data = await res.json();
	db.write(
	{
		org: config.orga,
		bucket: config.bucket,
		precision: 'ms'
	},
	[{
			measurement: config.measurement,
			tags: {host: config.devices[i].name},
			fields:
			{
				power: data.StatusSNS.ENERGY.Power,
				apperentpower: data.StatusSNS.ENERGY.ApparentPower,
				reactivepower: data.StatusSNS.ENERGY.ReactivePower,
				factor: data.StatusSNS.ENERGY.Factor,
				today: data.StatusSNS.ENERGY.Today,
				yesterday: data.StatusSNS.ENERGY.Yesterday,
				voltage: data.StatusSNS.ENERGY.Voltage,
				current: data.StatusSNS.ENERGY.Current
			},
	}]
	);
}

function gather_and_save_data ()
{
	for(let counter=0; counter <= ((config.devices.length - 1) ); counter++)
	{
		writeNewDataPoint(counter);
	}
}

setInterval(gather_and_save_data, 1000);


