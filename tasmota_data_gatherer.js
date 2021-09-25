const fetch = require('node-fetch');
const Influxdb = require('influxdb-v2');
const config = require('./config_influx2');
const db = new Influxdb({
	host: config.Influx,
	protocol: config.protocol,
	port: config.port,
	token: config.Token
});

async function writeNewDataPoint(i) {
	const res = await fetch('http://' + config.devices[i].ip + '/cm?cmnd=status%208');
	const data = await res.json();
	await db.write(
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
				current: data.StatusSNS.ENERGY.Current,
				total: data.StatusSNS.ENERGY.Total
			},
	}]
	);
}

function gather_and_save_data ()
{
	for(let counter=0; counter <= ((config.devices.length - 1) ); counter++)
	{
		writeNewDataPoint(counter).catch(error => {
			console.error('\nAn error occurred!', error);
		  });
	}
}

setInterval(gather_and_save_data, 1000);


