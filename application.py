import math
import sqlite3
import time

from flask import Flask, flash, jsonify, redirect, render_template, request, Response, session, url_for
from flask_session import Session

app = Flask(__name__)

app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


@app.route("/", methods=["GET", "POST"])
def index():

    if request.method == "POST":

        if "phase" in request.form:

            # If the "phase" value in the form sent by the xhttp request is equal to "start"
            if request.form["phase"] == "start":
                session["start_time"] = time.time()
                session["difficulty"] = request.form["difficulty"]

                return redirect("/")

            # If the "phase" value in the form sent by the xhttp request is equal to "end"
            elif request.form["phase"] == "end":
                session["end_time"] = time.time()
                session["elapsed_time"] = session["end_time"] - session["start_time"]

                # Establish connection with the sqlite3 database
                con = sqlite3.connect('records.db')
                con.row_factory = sqlite3.Row

                # Create a sqlite3 cursor object
                cur = con.cursor()

                # Query the sqlite3 database to see whether the user has set a record
                if session["difficulty"] == "easy":
                    cur.execute("SELECT * FROM easy ORDER BY time, id LIMIT 10")

                elif session["difficulty"] == "medium":
                    cur.execute("SELECT * FROM medium ORDER BY time, id LIMIT 10")

                elif session["difficulty"] == "hard":
                    cur.execute("SELECT * FROM hard ORDER BY time, id LIMIT 10")

                records = [dict(row) for row in cur]

                # Close the connection with the sqlite3 database
                con.close()

                # To get on the leaderboard, the user has to beat the tenth fastest time at the very least
                time_to_beat = records[9]["time"]
                set_record = session["elapsed_time"] < time_to_beat

                # Send to the browser the time it took the user to complete the challenge and a bool that represents whether that time is a record
                return jsonify(elapsedTime = session["elapsed_time"], setRecord = set_record)

        elif "name" in request.form:
            name = request.form["name"]

            # Establish connection with the sqlite3 database
            con = sqlite3.connect('records.db')
            con.row_factory = sqlite3.Row

            # Create a sqlite3 cursor object
            cur = con.cursor()

            # Insert the record into the correct table
            if session["difficulty"] == "easy":
                cur.execute("INSERT INTO easy (name, time, timestamp) VALUES (?, ?, datetime('now'))", (name, session["elapsed_time"]))

            elif session["difficulty"] == "medium":
                cur.execute("INSERT INTO medium (name, time, timestamp) VALUES (?, ?, datetime('now'))", (name, session["elapsed_time"]))

            elif session["difficulty"] == "hard":
                cur.execute("INSERT INTO hard (name, time, timestamp) VALUES (?, ?, datetime('now'))", (name, session["elapsed_time"]))

            # Save the changes
            con.commit()

            # Close the connection with the sqlite3 database
            con.close()

            # Display flash message
            flash("Record saved!")

            return redirect(f"/records?difficulty={session['difficulty']}")

    else:
        return render_template("index.html")


@app.route("/records", methods=["GET"])
def records():

    # Establish connection with the sqlite3 database
    con = sqlite3.connect('records.db')
    con.row_factory = sqlite3.Row

    # Create a sqlite3 cursor object
    cur = con.cursor()

    # Query the sqlite3 database for the records for each difficulty
    cur.execute("SELECT * FROM easy ORDER BY time, id LIMIT 10")
    records_easy = [dict(row) for row in cur]

    cur.execute("SELECT * FROM medium ORDER BY time, id LIMIT 10")
    records_medium = [dict(row) for row in cur]

    cur.execute("SELECT * FROM hard ORDER BY time, id LIMIT 10")
    records_hard = [dict(row) for row in cur]

    records_all = [records_easy, records_medium, records_hard]

    # Format the time for each of the records
    for records_difficulty in records_all:

        for row in records_difficulty:
            minutes = math.floor(row["time"] / 60)
            seconds = row["time"] % 60
            row["time"] = "".join(["{:01d}".format(minutes), "\' ", "{:06.3f}".format(seconds), "\""])

    # Close the connection with the sqlite3 database
    con.close()

    return render_template("records.html", records_easy=records_easy, records_medium=records_medium, records_hard=records_hard)