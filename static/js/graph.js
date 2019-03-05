queue()
    .defer(d3.csv, "data/gender.csv")
    .await(makeGraphs);
    
function makeGraphs(error, genderData) {
    var ndx = crossfilter(genderData);
    
    genderData.forEach(function(d){
        d.Height = parseInt(d.Height);
        d.Weight = parseInt(d.Weight);
    })
    
    show_discipline_selector(ndx);
    show_gender_balance(ndx);
    show_average_height(ndx);
    show_weight_to_height_correlation(ndx);
    
    dc.renderAll();
}

function show_discipline_selector(ndx) {
    var dim = ndx.dimension(dc.pluck('Gender'));
    var group = dim.group();
    
    dc.selectMenu("#discipline-selector")
        .dimension(dim)
        .group(group);
}


function show_gender_balance(ndx) {
    var dim = ndx.dimension(dc.pluck('Gender'));
    var group = dim.group();
    
    dc.barChart("#gender-balance")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);
}


function show_average_height(ndx) {
    var dim = ndx.dimension(dc.pluck('Gender'));
    
    function add_item(p, v) {
        p.count++;
        p.total += v.Height;
        p.average = p.total / p.count;
        return p;
    }

    function remove_item(p, v) {
        p.count--;
        if(p.count == 0) {
            p.total = 0;
            p.average = 0;
        } else {
            p.total -= v.Height;
            p.average = p.total / p.count;
        }
        return p;
    }
    
    function initialise() {
        return {count: 0, total: 0, average: 0};
    }

    var averageHeightByGender = dim.group().reduce(add_item, remove_item, initialise);

    dc.barChart("#average-height")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(averageHeightByGender)
        .valueAccessor(function(d){
            return d.value.average.toFixed(2);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(4);   
}

function show_weight_to_height_correlation(ndx) {
    
    var GenderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);
    var eDim = ndx.dimension(dc.pluck("Weight"));
    var experienceDim = ndx.dimension(function(d) {
        return [d.Weight, d.Height, d.Gender];
    });
    var experienceHeightGroup = experienceDim.group();

    var minExperience = eDim.bottom(1)[0].Weight;
    var maxExperience = eDim.top(1)[0].Weight;

    dc.scatterPlot("#weight-height")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minExperience, maxExperience]))
        .brushOn(true)
        .symbolSize(8)
        .clipPadding(10)
        .xAxisLabel("Weight")
        .title(function(d) {
            return d.key[2] + "of height  " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[2];
        })
        .colors(GenderColors)
        .dimension(experienceDim)
        .group(experienceHeightGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}