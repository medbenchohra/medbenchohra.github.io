var f = d3.format(".1f");
var circle_tgts = document.getElementsByClassName("target");
var gen_tgt = (Math.PI * 2) / 13;
var x_axis = 0;
var y_axis = 0;
var angle = 0;
var radius = 200;
var width = 25;
var height = 25;
var center_top = (450 - 70) / 2;
var center_left = (450 - 70) / 2;
var click_count;
var curr_time;
var target_reach_time;
var cursor_travel_times;
var choice_width;
var choice_dist;
var idx = Math.floor(Math.random() * 12);
var trials = [];
var configurations_trials = [];
var target_missed_clicks = 0;
var trial_missed_clicks = 0;
var total_missed_clicks = 0;
var userid;
var test_widths_solid_list = [25, 50, 75];
var test_distances_solid_list = [100, 150, 200];
var test_widths;
var test_distances;

function update_circles(circle_targets, targets_width, targets_distance) {
    $(circle_targets).css('opacity', '0').each(function(i) {
        var elem = circle_targets[i];
        x_axis = targets_distance * Math.cos(angle) + center_left;
        y_axis = targets_distance * Math.sin(angle) + center_top;
        $(elem).css("background-color", "#3393ab");
        $(elem).off("click");
        $(elem).animate({
            'position': 'absolute',
            'width': targets_width + 'px',
            'height': targets_width + 'px',
            'left': x_axis + 'px',
            'top': y_axis + 'px',
            'opacity': '1'
        });
        angle += gen_tgt;
    });
}

$(document).ready(function() {
    $('.target').css({ 'top': center_top + 'px', 'left': center_left + 'px' });
    update_circles(circle_tgts, 50, 150);
    document.onclick = function(e) {
        if (e.target.id == 'slider-1') {
            target_missed_clicks++;
        }
    }
});

const cartesian_product = (...ar) => ar.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

async function start_trial() {
    test_widths = test_widths_solid_list;
    test_distances = test_distances_solid_list;
    // Shuffling the lists to get a random pairing of widths and distances.
    test_widths.sort(() => Math.random() - 0.5);
    test_distances.sort(() => Math.random() - 0.5);
    // Using a cartesian product to get all possible configurations.
    let configurations = cartesian_product(test_widths, test_distances);
    // We again shuffle the list since the cartesian product results in a continuity of the values on the left.
    // Shuffling two times because there are 3 consecutive similar values, and the sorting parameter sorts
    //      based on the sign (50% each), hence two are needed to separated the three values. 
    configurations.sort(() => Math.random() - 0.5);
    configurations.sort(() => Math.random() - 0.5);
    // To have to user id only in a 3-digit form, i.e. from 10 to 99; general formula: Math.floor(Math.random()*(max-min+1)+min);
    // userid = Math.floor(Math.random() * 900 + 100);
    let date = new Date();
    let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date).padStart(4, '0');
    let mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date).padStart(2, '0');
    let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date).padStart(2, '0');
    let h = new Intl.DateTimeFormat('en', { hour: 'numeric', hourCycle: 'h24' }).format(date).padStart(2, '0');
    let m = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(date).padStart(2, '0');
    let s = new Intl.DateTimeFormat('en', { second: '2-digit' }).format(date).padStart(2, '0');
    userid = `${ye}${mo}${da}_${h}${m}${s}`;

    $('.target').css({ 'top': center_top + 'px', 'left': center_left + 'px' });

    // Testing all 9 configurations:
    total_missed_clicks = 0;
    configurations_trials = [];
    for (const conf of configurations) {
        trials = [];
        cursor_travel_times = [];
        trial_missed_clicks = 0;
        choice_width = conf[0];
        choice_dist = conf[1];
        update_circles(circle_tgts, choice_width, choice_dist);
        await run_configuration(choice_width, choice_dist);
        total_missed_clicks += trial_missed_clicks
        var difficulty_index_value = Math.round(difficulty_index(choice_width, choice_dist) * 100) / 100;
        var configuration_total_time = cursor_travel_times.reduce((a, b) => a + b, 0);
        configurations_trials.push([choice_width, choice_dist, difficulty_index_value, configuration_total_time, target_missed_clicks, target_missed_clicks / 13]);
    }

    // Creating the global CSV file of all configuration done by the current user.
    var csv_configuration = `Full experiment stats for the user ${userid}\n\n`;
    csv_configuration += 'Targets width, Targets distance, Difficulty index (ID), Total time (s), Total Missed Clicks, Error Rate\n';
    configurations_trials.forEach(function(row) { csv_configuration += (row.join(',') + "\n") });
    var hiddenElementGlobal = document.createElement('a');
    hiddenElementGlobal.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_configuration);
    hiddenElementGlobal.target = '_blank';

    // Downloading the CSV file containing the global info once all the trials (configurations) are done.  
    // The CSV file name will be of the format: USERID.csv
    // The USERID itself being of a date-based format: YYYYMMDD_HHMMSS. Foe eg: 20220214_142345
    hiddenElementGlobal.download = userid + '_global_stats.csv';
    hiddenElementGlobal.click();
}

async function run_configuration(current_width, current_dist) {
    click_count = 0
    var target_clicked = false;
    while (click_count != 13) {
        target_clicked = false;
        curr_time = Date.now();
        target_missed_clicks = 0;
        $(circle_tgts[idx]).css("background-color", "#f2900f");
        // Bring the target circle on top of others (mostly neighbouring ones when the distance is low).
        $(circle_tgts[idx]).css("z-index", 1);
        $(circle_tgts[idx]).click(function() {
            target_clicked = true
            click_count++;
            $(circle_tgts[idx]).off("click");
            $(circle_tgts[idx]).css("background-color", "#3393ab");
            $(circle_tgts[idx]).css("z-index", 0);
            target_reach_time = (Date.now() - curr_time) / 1000;
            cursor_travel_times.push(target_reach_time);
            trial_missed_clicks += target_missed_clicks;
            // The next target will be on the opposite side:
            idx = (6 + idx) % 13;
            trials.push([target_reach_time, target_missed_clicks]);
        });
        await waitUntil(() => target_clicked);
    }

    // Creating the trial CSV file.
    var csv_trial = `Trial stats for user ${userid} with targets of width ${current_width} and distance ${current_dist}:\n\n`;
    csv_trial += 'Time to reach target (s),Missed clicks\n';
    trials.forEach(function(row) { csv_trial += (row.join(',') + "\n") });
    var hiddenElementTrial = document.createElement('a');
    hiddenElementTrial.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_trial);
    hiddenElementTrial.target = '_blank';

    // Downloading the CSV file containing the trial info once the trial is done.  
    // The CSV file name will be of the format: USERID_W-{targetwidth}_D-{targetdistance}.csv
    // The USERID itself being of a date-based format: YYYYMMDD_HHMMSS. Foe eg: 20220214_142345
    hiddenElementTrial.download = userid + '_W-' + current_width + '_D-' + current_dist + '.csv';
    hiddenElementTrial.click();
}

const waitUntil = (condition) => {
    return new Promise((resolve) => {
        let interval = setInterval(() => {
            if (!condition()) return
            clearInterval(interval)
            resolve()
        }, 100)
    })
}

function difficulty_index(targerwidth, distance) {
    return Math.log2(distance / targerwidth + 1)
}