const fetch = require('node-fetch');
const Influxdb = require('influxdb-v2');
const { isHoliday } = require('feiertagejs');
const config = require('./config_influx2');
const db = new Influxdb({
	host: config.Influx,
	protocol: config.protocol,
	port: config.port,
	token: config.Token
});

const GetCurrentTariff = (today = new Date()) => {
	return new Promise((resolve, reject) => {
		//Check if its Holiday or Sunday
		if (isHoliday(today, 'BY') || today.getDay() == 0) {
			resolve({
				tariff: 'NT',
				cost: config.price_nt
			});
		} else {
			let startTime, endTime;

			if (today.getDay() == 6) {
				//Definition of HT time from 06 to 13 on saturday
				startTime = '06:00:00';
				endTime = '13:00:00';
			} else {
				//Definition of HT time from 06 to 22 on monday to friday
				startTime = '06:00:00';
				endTime = '22:00:00';
			}

			startDate = new Date(today.getTime());
			startDate.setHours(startTime.split(":")[0]);
			startDate.setMinutes(startTime.split(":")[1]);
			startDate.setSeconds(startTime.split(":")[2]);

			endDate = new Date(today.getTime());
			endDate.setHours(endTime.split(":")[0]);
			endDate.setMinutes(endTime.split(":")[1]);
			endDate.setSeconds(endTime.split(":")[2]);

			valid = startDate < today && endDate > today

			//True if its between 6 and 22 at a workday
			if (valid) {
				resolve({
					tariff: 'HT',
					cost: config.price_ht
				});
			} else {
				resolve({
					tariff: 'NT',
					cost: config.price_nt
				});
			}
		}
	});
}

async function writeNewDataPoint(i) {
	const { tariff, cost } = await GetCurrentTariff();
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
			tags: { host: config.devices[i].name },
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
				total: data.StatusSNS.ENERGY.Total,
				tariff: tariff,
				costperkwh: cost
			},
		}]
	);
}

function gather_and_save_data() {
	for (let counter = 0; counter <= ((config.devices.length - 1)); counter++) {
		writeNewDataPoint(counter).catch(error => {
			console.error('\nAn error occurred!', error);
		});
	}
}

setInterval(gather_and_save_data, 1000);