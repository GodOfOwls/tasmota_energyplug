const fetch = require('node-fetch');
const fs = require('fs');
const Influx = require('influx');
var config = require('/home/pi/energy_consumption/config');
const db = new Influx.InfluxDB(config.Influx);

async function writeNewDataPoint(i) {
	const res = await fetch('http://' + config.devices[i].ip + '/cm?cmnd=status%208');
	const data = await res.json();
	db.writePoints([
		{
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
		}
	], {
		database: config.database,
		precision: 's',
	}).catch(error => {
		console.error('Error saving data to InfluxDB!' + error)
	});

}

function gather_and_save_data ()
{
	for(let counter=0; counter <= ((config.devices.length - 1) ); counter++)
	{
		writeNewDataPoint(counter);
	}
}

setInterval(gather_and_save_data, 1000);


