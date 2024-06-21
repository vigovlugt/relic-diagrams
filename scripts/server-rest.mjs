#!/bin/env node

import { readFileSync, readdirSync, writeFileSync } from "fs";

function getData() {
    const obj = {};
    const rows = readdirSync("./data/results-rest");
    for (const row of rows) {
        obj[row] = {};
        const experiments = readdirSync(`./data/results-rest/${row}`);
        for (const experiment of experiments) {
            const file = readFileSync(
                `./data/results-rest/${row}/${experiment}`,
                "utf8"
            );
            obj[row][experiment.replace(".json", "")] = JSON.parse(file);
        }
    }

    return obj;
}

const data = getData();

const rows = Object.keys(data).length;
const experiments = [
    "reservations",
    "create reservation",
    "update reservation",
    "delete reservation",
]

/**
 * @param {string} e
 */
function experimentLabel(e) {
    switch (e) {
        case "reservations":
            return "Get reservations";
        case "create reservation":
            return "Create reservation";
        case "update reservation":
            return "Update reservation";
        case "delete reservation":
            return "Delete reservation";
    }

    throw new Error("Unknown experiment: " + e);
}

/**
 * @param {string[]} strings
 */
export function legend(...strings) {
    return `\\legend{${strings.join(",")}}`;
}

/**
 * @param {Array<{x: number, y: number}>} data
 */
export function addPlot(data) {
    return `\\addplot coordinates {
${data.map((d) => `(${d.x},${d.y})`).join("\n")}
};`;
}

/**
 * @param {string} children
 * @param {string} ylabel
 * @param {string} xlabel
 */
export function tikzpicture(children, ylabel, xlabel, legendPos) {
    return `\\begin{tikzpicture}
\\begin{axis}[
    scaled x ticks=false,
    xticklabel style={
        /pgf/number format/fixed,
    },
    enlargelimits=0.05,
    xmode=log,
    legend pos=${legendPos},
	ylabel=${ylabel},
    xlabel=${xlabel},
]
${children}
\\end{axis}
\\end{tikzpicture}
`;
}

export function figure(children, caption, label) {
    return `\\begin{figure}[H]
    \\centering

${children}
    
    \\caption{${caption}}
    \\label{${label}}
\\end{figure}`;
}

export function subFigure(children, caption, label) {
    return `\\begin{subfigure}[b]{0.48\\textwidth}
    \\centering
    
${children}

    \\caption{${caption}}
    \\label{${label}}
\\end{subfigure}`;
}

export function resizeBox(children) {
    return `\\resizebox{\\textwidth}{!}{
${children}
}`;
}

export function getReservationsSubFigure() {
    const plots = ["reservations"].map((e) =>
        addPlot(
            Object.keys(data).map((r) => ({
                x: parseInt(r),
                y: data[r][e].metrics.http_reqs.values.rate,
            }))
        )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") + "\n" + legend("Get reservations"),
                "Requests per second",
                "Total number of rows client can access",
                "north east"
            )
        ),
        "Throughput in requests per second for getting reservations.",
        "fig:server-rest-get"
    );
}

export function getReservationsLatencySubFigure() {
    const plots = ["reservations"].map((e) =>
        addPlot(
            Object.keys(data).map((r) => ({
                x: parseInt(r),
                y: data[r][e].metrics.http_req_duration.values.avg,
            }))
        )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") + "\n" + legend("Get reservations"),
                "Latency (ms)",
                "Total number of rows client can access",
                "south east"
            )
        ),
        "Average latency in milliseconds for getting reservations.",
        "fig:server-rest-get-latency"
    );
}



export function mutationsSubFigure() {
    const plots = [
        "create reservation",
        "update reservation",
        "delete reservation",
    ].map((e) =>
        addPlot(
            Object.keys(data).map((r) => ({
                x: parseInt(r),
                y: data[r][e].metrics.http_reqs.values.rate,
            }))
        )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") +
                "\n" +
                legend(
                    "Create reservation",
                    "Update reservation",
                    "Delete reservation"
                ),
                "Requests per second",
                "Total number of rows client can access",
                "north east"
            )
        ),
        "Throughput for creating, updating or deleting reservations.",
        "fig:server-rest-mutations"
    );
}

export function mutationsLatencySubFigure() {
    const plots = [
        "create reservation",
        "update reservation",
        "delete reservation",
    ].map((e) =>
        addPlot(
            Object.keys(data).map((r) => ({
                x: parseInt(r),
                y: data[r][e].metrics.http_req_duration.values.avg,
            }))
        )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") +
                "\n" +
                legend(
                    "Create reservation",
                    "Update reservation",
                    "Delete reservation"
                ),
                "Latency (ms)",
                "Total number of rows client can access",
                "north west"
            )
        ),
        "Average latency in milliseconds for creating, updating or deleting reservations.",
        "fig:server-rest-mutations-latency"
    );
}

export function tableThroughput() {
    return `\\begin{table}[H]
\\centering
\\begin{tabular}{${"l".repeat(rows + 1)}}
\\textbf{Rows} & ${Object.keys(data)
            .map((r) => `\\textbf{${r}}`)
            .join(" & ")} \\\\
${experiments
            .map(
                (e) =>
                    `\\textbf{${experimentLabel(e)}} & ` +
                    Object.values(data)
                        .map(
                            (obj) =>
                                `${parseFloat(
                                    obj[e].metrics.http_reqs.values.rate.toFixed(2)
                                )}`
                        )
                        .join(" & ")
            )
            .join("\\\\\n")}
\\end{tabular}
\\caption{Througput in requests per second for server-side operations per number of rows client may access for the REST server.}
\\label{tab:server-rest-experiment}
\\end{table}
`;
}

export function tableLatency() {
    return `\\begin{table}[H]
\\centering
\\begin{adjustbox}{width=\\textwidth}
\\begin{tabular}{${"l".repeat(rows + 1)}}
\\textbf{Rows} & ${Object.keys(data)
            .map((r) => `\\textbf{${r}}`)
            .join(" & ")} \\\\
${experiments
            .map(
                (e) =>
                    `\\textbf{${experimentLabel(e)}} & ` +
                    Object.values(data)
                        .map(
                            (obj) =>
                                `${parseFloat(
                                    obj[e].metrics.http_req_duration.values.avg.toFixed(2)
                                )} (${parseFloat(
                                    obj[e].metrics.http_req_duration.values["p(95)"].toFixed(2)
                                )})`
                        )
                        .join(" & ")
            )
            .join("\\\\\n")}
\\end{tabular}
\\end{adjustbox}
\\caption{Average latency in milliseconds for server-side operations per number of rows client may access for the REST server. The 95th percentile of latency is shown in parentheses.}
\\label{tab:server-rest-experiment-latency}
\\end{table}
`;
}

const result = `
${tableThroughput()}
${tableLatency()}
${figure(
    `${getReservationsSubFigure()}
\\hfill
${getReservationsLatencySubFigure()}
\\\\
${mutationsSubFigure()}
\\hfill
${mutationsLatencySubFigure()}`,
    "Throughput for serving get, create, update and delete requests by number of rows clients may access for the REST server.",
    "fig:server-rest-experiment"
)}
`;

console.log(result);
writeFileSync("./output/server-rest.tex", result, "utf8");
