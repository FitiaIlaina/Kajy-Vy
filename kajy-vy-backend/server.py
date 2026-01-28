from flask import Flask, request, jsonify, send_from_directory, render_template, url_for, session, flash, redirect, make_response
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, create_refresh_token, get_jwt
from functools import wraps
from flask_cors import CORS
import os
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image, ImageDraw
import cairosvg
import tempfile
import mysql.connector
import bcrypt
from datetime import timedelta
import math

app = Flask(__name__)

app.config['JWT_SECRET_KEY'] = 'Kajy-Vy-application'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

jwt = JWTManager(app)

app.secret_key = "kajyvy"

CORS(app)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials","Access-Control-Allow-Origin","Access-Control-Allow-Headers","Access-Control-Allow-Methods"],
        "supports_credentials": True
    }
})

upload_folder = 'uploads'
os.makedirs(upload_folder, exist_ok=True)

con = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='kajyvy'
)

blacklist_token= set()
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    return jwt_payload['jti'] in blacklist_token


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
        response.headers.add('Access-Control-Allow-Methods', "GET,POST,OPTIONS")
        return response

@app.route("/Data")
def database():
    cursor = con.cursor()
    cursor.execute('SELECT * FROM cadre')
    data = cursor.fetchall()
    cursor.close()
    return jsonify(data)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'loggedin' not in session:
            flash('Veuillez vous connecter pour accéder à cette page.', 'warning')
            return redirect(url_for('adminlogin'))
        return f(*args, **kwargs)
    return decorated_function

@app.route("/Admin-connexion", methods=['GET', 'POST'])
def adminlogin():
    message = ""
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        email = request.form['email']
        password = request.form['password']
        
        cursor = con.cursor(dictionary=True)
        try:
            cursor.execute('SELECT * FROM administrateur WHERE email = %s', (email,))
            user = cursor.fetchone()
            
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                session['loggedin'] = True
                session['id'] = int(user['id_admin'])
                session['name'] = user['name']
                session['email'] = user['email']
                session['role'] = user['role']
                
                message=("Vous êtes connecté en tant qu'administrateur !")
                return redirect(url_for('adminPage'))
            else:
                message = "Identifiants administrateur invalides."
        finally:
            cursor.close()
        
    return render_template("adminlogin.html", message=message)


@app.route("/Admin-inscription", methods=['GET','POST'])
def adminregister():
    message = ""
    if request.method == 'POST' and 'email' in request.form and 'name' in request.form and 'surname' in request.form and 'password' in request.form and 'confirmpassword' in request.form:
        email = request.form['email']
        name = request.form['name']
        surname = request.form['surname']
        password = request.form['password']
        confirmpassword = request.form['confirmpassword']
        
        hashPassword = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT id_admin FROM administrateur WHERE email = %s", (email,))
        user_exist = cursor.fetchone()
        
        if user_exist:
            message="Email déjà utilisé"
        elif not email or not password:
            message = 'Veuillez remplir le formulaire !'
        elif password != confirmpassword:
            message = 'Les mots de passe ne correspondent pas !'
        else:
        
            cursor.execute("INSERT INTO administrateur (email, name, surname,password, role) VALUES (%s, %s, %s,%s,%s)", (email, name, surname, hashPassword, 'admin'))
            con.commit()
            message = 'Compte enregistré avec succès'
            
            cursor.execute('SELECT * FROM administrateur WHERE email = %s', (email,))
            newUser = cursor.fetchone()
            
            session['loggedin'] = True
            session['id'] = newUser['id_admin']
            session['name'] = newUser['name']
            session['surname'] = newUser['surname']
            session['email'] = newUser['email']
            session['role'] = 'admin' 
            cursor.close()
            
            return render_template('adminPage.html', message=message)        
    return render_template("adminregister.html", message=message)

@app.route("/Admin-Accueil")
@login_required
def adminPage():
    cursor= con.cursor(dictionary=True)
    cursor.execute("SELECT * FROM utilisateurs")
    users = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre")
    cadres = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre_grille")
    cadres_grille = cursor.fetchall()
    
    cursor.execute("SELECT * FROM decoration")
    decorations = cursor.fetchall()
    
    cursor.execute("SELECT * FROM bati")
    batis = cursor.fetchall()
    
    cursor.execute("SELECT * FROM tole")
    toles = cursor.fetchall()
    
    cursor.execute("SELECT * FROM consommables")
    consommables = cursor.fetchall()
    
    cursor.close()
    
    return render_template("adminPage.html", users=users, cadres=cadres, 
                         cadres_grille=cadres_grille, 
                         decorations=decorations, 
                         batis=batis, 
                         toles=toles, consommables=consommables, admin_name=session.get('name'),
                         admin_email=session.get('email'))
    
@app.route("/Admin-deconnexion")
def admin_logout():
    session.pop('loggedin', None)
    session.pop('id', None)
    session.pop('email', None)
    session.pop('name', None)
    session.pop('surname', None)
    session.pop('role', None)
    flash('Vous avez été déconnecté avec succès.', 'success')
    return redirect(url_for('adminlogin'))    
    
@app.route("/Admin-Fer")
@login_required
def admin_fer():
    cursor= con.cursor(dictionary=True)
    cursor.execute("SELECT * FROM utilisateurs")
    users = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre")
    cadres = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre_grille")
    cadres_grille = cursor.fetchall()
    
    cursor.execute("SELECT * FROM decoration")
    decorations = cursor.fetchall()
    
    cursor.execute("SELECT * FROM bati")
    batis = cursor.fetchall()
    
    cursor.execute("SELECT * FROM tole")
    toles = cursor.fetchall()
    cursor.close()
    return render_template("fer.html", users=users, cadres=cadres, 
                         cadres_grille=cadres_grille, 
                         decorations=decorations, 
                         batis=batis, 
                         toles=toles, admin_name=session.get('name'),
                         admin_email=session.get('email'))
    
@app.route("/Admin-Utilisateurs")
@login_required
def admin_users():
    cursor= con.cursor(dictionary=True)
    cursor.execute("SELECT * FROM utilisateurs")
    users = cursor.fetchall()
    cursor.close()
    return render_template("userlist.html", users=users, admin_name=session.get('name'),
                         admin_email=session.get('email'))



@app.route("/Admin-Utilisateurs/voir/<int:user_id>")
@login_required
def adminPageDetail(user_id):
    cursor = con.cursor(dictionary=True)

    cursor.execute("SELECT * FROM utilisateurs")
    users = cursor.fetchall()

    cursor.execute("SELECT * FROM utilisateurs WHERE id_user = %s", (user_id,))
    selected_user = cursor.fetchone()

    return render_template("userlist.html", users=users, selected_user=selected_user, admin_name=session.get('name'),
                         admin_email=session.get('email'))

@app.route("/Admin-Consommables")
@login_required
def admin_consommables():
    cursor= con.cursor(dictionary=True)
    cursor.execute("SELECT * FROM consommables")
    consommables = cursor.fetchall()
    cursor.close()
    return render_template("consommable.html", consommables=consommables, admin_name=session.get('name'),
                         admin_email=session.get('email'))


@app.route("/Admin-Fer/ajouter/cadre", methods=["POST"])
@login_required
def ajoutercadre():
   
    cursor = con.cursor(dictionary=True)

    type_cadre = request.form["type_cadre"]
    prix_peinture = request.form["prix_peinture"]
    prix_type = request.form["prix_type"]

    cursor.execute("INSERT INTO cadre (type_cadre, prix_peinture, prix_type) VALUES (%s, %s, %s)", (type_cadre, prix_peinture, prix_type))
    con.commit()
    flash("Cadre ajouté avec succès !", "success")
    cursor.close()

    return redirect("/Admin-Fer?section=cadre")

@app.route("/Admin-Fer/ajouter/cadre-grille", methods=["POST"])
@login_required
def ajoutercadregrille():
   
    cursor = con.cursor(dictionary=True)

    type_cadre = request.form["type_cadre"]
    prix_peinture = request.form["prix_peinture"]
    prix_type = request.form["prix_type"]

    cursor.execute("INSERT INTO cadre_grille (type_cadre, prix_peinture, prix_type) VALUES (%s, %s, %s)", (type_cadre, prix_peinture, prix_type))
    con.commit()
    flash("Cadre pour grille ajouté avec succès !")
    cursor.close()

    return redirect("/Admin-Fer?section=grille")

@app.route("/Admin-Fer/ajouter/batis", methods=["POST"])
@login_required
def ajouterbati():
   
    cursor = con.cursor(dictionary=True)

    type_bati = request.form["type_bati"]
    prix_peinture = request.form["prix_peinture"]
    prix_type = request.form["prix_type"]

    cursor.execute("INSERT INTO bati (type_bati, prix_peinture, prix_type) VALUES (%s, %s, %s)", (type_bati, prix_peinture, prix_type))
    con.commit()
    flash("Type de bâti ajouté avec succès !")
    cursor.close()

    return redirect("/Admin-Fer?section=bati")

@app.route("/Admin-Fer/ajouter/decoration", methods=["POST"])
@login_required
def ajouterdecoration():
   
    cursor = con.cursor(dictionary=True)

    type_decoration = request.form["type_decoration"]
    prix_peinture = request.form["prix_peinture"]
    prix_type = request.form["prix_type"]

    cursor.execute("INSERT INTO decoration (type_decoration, prix_peinture, prix_type) VALUES (%s, %s, %s)", (type_decoration, prix_peinture, prix_type))
    con.commit()
    flash("Type de décoration ajouté avec succès !")
    cursor.close()

    return redirect("/Admin-Fer?section=decoration")

@app.route("/Admin-Fer/ajouter/toles", methods=["POST"])
@login_required
def ajoutertole():
   
    cursor = con.cursor(dictionary=True)

    type_tole = request.form["type_tole"]
    prix_peinture = request.form["prix_peinture"]
    prix_type = request.form["prix_type"]

    cursor.execute("INSERT INTO tole (type_tole, prix_peinture, prix_type) VALUES (%s, %s, %s)", (type_tole, prix_peinture, prix_type))
    con.commit()
    flash("Type de tôle ajouté avec succès !")
    cursor.close()

    return redirect("/Admin-Fer?section=tole")


@app.route("/Admin-Fer/modifier/cadre/<int:id_cadre>", methods=["GET", "POST"])
@login_required
def modifiercadre(id_cadre):
    cursor = con.cursor(dictionary=True)

    if request.method == "POST":
       
        type_cadre = request.form["type_cadre"]
        prix_peinture = request.form["prix_peinture"]
        prix_type = request.form["prix_type"]

     
        cursor.execute("""
            UPDATE cadre
            SET type_cadre=%s, prix_peinture=%s, prix_type=%s
            WHERE id_cadre=%s
        """, (type_cadre, prix_peinture, prix_type, id_cadre))
        con.commit()

        return redirect("/Admin-Fer?section=cadre", )

   
    cursor.execute("SELECT * FROM cadre WHERE id_cadre = %s", (id_cadre,))
    cadre_edit = cursor.fetchone()

    cursor.execute("SELECT * FROM cadre")
    cadres = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre_grille")
    cadres_grille = cursor.fetchall()
    
    cursor.execute("SELECT * FROM decoration")
    decorations = cursor.fetchall()
    
    cursor.execute("SELECT * FROM bati")
    batis = cursor.fetchall()
    
    cursor.execute("SELECT * FROM tole")
    toles = cursor.fetchall()

    return render_template("fer.html", active_section ='cadre',cadres=cadres, cadre_edit=cadre_edit,cadres_grille=cadres_grille, decorations=decorations,batis=batis, toles=toles, admin_name=session.get('name'),
                         admin_email=session.get('email'))



@app.route("/Admin-Fer/modifier/cadre-grille/<int:id_grille>", methods=["GET", "POST"])
@login_required
def modifiercadregrille(id_grille):
    cursor = con.cursor(dictionary=True)

    if request.method == "POST":
        
        type_cadre = request.form["type_cadre"]
        prix_peinture = request.form["prix_peinture"]
        prix_type = request.form["prix_type"]

      
        cursor.execute("""
            UPDATE cadre_grille
            SET type_cadre=%s, prix_peinture=%s, prix_type=%s
            WHERE id_grille=%s
        """, (type_cadre, prix_peinture, prix_type, id_grille))
        con.commit()

        return redirect("/Admin-Fer?section=grille")

    cursor.execute("SELECT * FROM cadre_grille WHERE id_grille = %s", (id_grille,))
    cadre_grille_edit = cursor.fetchone()

    cursor.execute("SELECT * FROM cadre_grille")
    cadres_grille = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre")
    cadres = cursor.fetchall()
    
    cursor.execute("SELECT * FROM decoration")
    decorations = cursor.fetchall()
    
    cursor.execute("SELECT * FROM bati")
    batis = cursor.fetchall()
    
    cursor.execute("SELECT * FROM tole")
    toles = cursor.fetchall()

    return render_template("fer.html",active_section='grille', cadres_grille=cadres_grille,cadres=cadres, decorations=decorations, toles=toles, batis=batis, cadre_grille_edit=cadre_grille_edit, admin_name=session.get('name'),
                         admin_email=session.get('email'))


@app.route("/Admin-Fer/modifier/batis/<int:id_bati>", methods=["GET", "POST"])
@login_required
def modifierbati(id_bati):
    cursor = con.cursor(dictionary=True)

    if request.method == "POST":
        type_bati = request.form["type_bati"]
        prix_peinture = request.form["prix_peinture"]
        prix_type = request.form["prix_type"]

        cursor.execute("""
            UPDATE bati
            SET type_bati=%s, prix_peinture=%s, prix_type=%s
            WHERE id_bati=%s
        """, (type_bati, prix_peinture, prix_type, id_bati))
        con.commit()
        return redirect("/Admin-Fer?section=bati")

    cursor.execute("SELECT * FROM bati WHERE id_bati = %s", (id_bati,))
    bati_edit = cursor.fetchone()

    cursor.execute("SELECT * FROM bati")
    batis = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre")
    cadres = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre_grille")
    cadres_grille = cursor.fetchall()
    
    cursor.execute("SELECT * FROM decoration")
    decorations = cursor.fetchall()

    
    cursor.execute("SELECT * FROM tole")
    toles = cursor.fetchall()

    return render_template("fer.html",active_section='bati', batis=batis,decorations=decorations, cadres_grille=cadres_grille, cadres=cadres, toles=toles,bati_edit=bati_edit, admin_name=session.get('name'),
                         admin_email=session.get('email'))


@app.route("/Admin-Fer/modifier/decoration/<int:id_decoration>", methods=["GET", "POST"])
@login_required
def modifierdecoration(id_decoration):
    cursor = con.cursor(dictionary=True)

    if request.method == "POST":
        type_decoration = request.form["type_decoration"]
        prix_peinture = request.form["prix_peinture"]
        prix_type = request.form["prix_type"]

        cursor.execute("""
            UPDATE decoration
            SET type_decoration=%s, prix_peinture=%s, prix_type=%s
            WHERE id_decoration=%s
        """, (type_decoration, prix_peinture, prix_type, id_decoration))
        con.commit()
        return redirect("/Admin-Fer?section=decoration")


    cursor.execute("SELECT * FROM decoration WHERE id_decoration = %s", (id_decoration,))
    deco_edit = cursor.fetchone()

    cursor.execute("SELECT * FROM decoration")
    decorations = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre")
    cadres = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre_grille")
    cadres_grille = cursor.fetchall()
    
    cursor.execute("SELECT * FROM bati")
    batis = cursor.fetchall()
    
    cursor.execute("SELECT * FROM tole")
    toles = cursor.fetchall()

    return render_template("fer.html",active_section='decoration', decorations=decorations, batis=batis, toles=toles, cadres_grille=cadres_grille,cadres=cadres,deco_edit=deco_edit, admin_name=session.get('name'),
                         admin_email=session.get('email'))


@app.route("/Admin-Fer/modifier/toles/<int:id_tole>", methods=["GET", "POST"])
@login_required
def modifiertole(id_tole):
    cursor = con.cursor(dictionary=True)

    if request.method == "POST":
        
        type_tole = request.form["type_tole"]
        prix_peinture = request.form["prix_peinture"]
        prix_type = request.form["prix_type"]

       
        cursor.execute("""
            UPDATE tole
            SET type_tole=%s, prix_peinture=%s, prix_type=%s
            WHERE id_tole=%s
        """, (type_tole, prix_peinture, prix_type, id_tole))
        con.commit()
        return redirect("/Admin-Fer?section=tole")


    
    cursor.execute("SELECT * FROM tole WHERE id_tole = %s", (id_tole,))
    tole_edit = cursor.fetchone()

    cursor.execute("SELECT * FROM tole")
    toles = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre")
    cadres = cursor.fetchall()
    
    cursor.execute("SELECT * FROM cadre_grille")
    cadres_grille = cursor.fetchall()
    
    cursor.execute("SELECT * FROM decoration")
    decorations = cursor.fetchall()
    
    cursor.execute("SELECT * FROM bati")
    batis = cursor.fetchall()


    return render_template("fer.html",active_section='tole', toles=toles, tole_edit=tole_edit,cadres=cadres, cadres_grille=cadres_grille, decorations=decorations, batis=batis, admin_name=session.get('name'),
                         admin_email=session.get('email'))


@app.route("/Admin-Fer/modifier/consommables/<int:id_cons>", methods=["GET", "POST"])
@login_required
def modifiercons(id_cons):
    cursor = con.cursor(dictionary=True)

    if request.method == "POST":
        
        nom_cons = request.form["nom_cons"]
        prix_cons = request.form["prix_cons"]
       
        cursor.execute("""
            UPDATE consommables
            SET nom_cons=%s, prix_cons=%s
            WHERE id_cons=%s
        """, (nom_cons, prix_cons, id_cons))
        con.commit()
        return redirect("/Admin-Consommables")

    cursor.execute("SELECT * FROM consommables WHERE id_cons = %s", (id_cons,))
    cons_edit = cursor.fetchone()

    cursor.execute("SELECT * FROM consommables")
    consommables = cursor.fetchall()

    return render_template("consommable.html", consommables=consommables, cons_edit=cons_edit, admin_name=session.get('name'),
                         admin_email=session.get('email'))


@app.route("/Admin-Fer/supprimer/<int:user_id>", methods=["POST"])
@login_required
def supprimer_user(user_id):
    cursor = con.cursor(dictionary=True)
    
    cursor.execute("DELETE FROM utilisateurs WHERE id_user = %s", (user_id,))
    con.commit()
    
    return redirect("/Admin-Utilisateurs")

@app.route("/Admin-Fer/supprimer/cadre/<int:id_cadre>", methods=["POST"])
@login_required
def supprimer_cadre(id_cadre):
    cursor = con.cursor()
    
    cursor.execute("DELETE FROM cadre WHERE id_cadre = %s", (id_cadre,))
    con.commit()
    flash("Cadre supprimé avec succès !", "success")
    
    cursor.close()
    
    return redirect("/Admin-Fer")

@app.route("/Admin-Fer/supprimer/cadre-grille/<int:id_grille>", methods=["POST"])
@login_required
def supprimer_cadre_grille(id_grille):
    cursor = con.cursor()
    
    cursor.execute("DELETE FROM cadre_grille WHERE id_grille = %s", (id_grille,))
    con.commit()
    flash("Cadre pour grille supprimé avec succès !")
    
    cursor.close()
    
    return redirect("/Admin-Fer")

@app.route("/Admin-Fer/supprimer/bati/<int:id_bati>", methods=["POST"])
@login_required
def supprimer_bati(id_bati):
    cursor = con.cursor()
    
    cursor.execute("DELETE FROM bati WHERE id_bati = %s", (id_bati,))
    con.commit()
    flash("Type de bâti supprimé avec succès !")
    
    cursor.close()
    
    return redirect("/Admin-Fer")

@app.route("/Admin-Fer/supprimer/decoration/<int:id_decoration>", methods=["POST"])
@login_required
def supprimer_decoration(id_decoration):
    cursor = con.cursor()
    
    cursor.execute("DELETE FROM decoration WHERE id_decoration = %s", (id_decoration,))
    con.commit()
    flash("Type de décoration supprimé avec succès !")
    
    cursor.close()
    
    return redirect("/Admin-Fer")

@app.route("/Admin-Fer/supprimer/toles/<int:id_tole>", methods=["POST"])
@login_required
def supprimer_tole(id_tole):
    cursor = con.cursor()
    
    cursor.execute("DELETE FROM tole WHERE id_tole = %s", (id_tole,))
    con.commit()
    flash("Type de tôle supprimé avec succès !")
    
    cursor.close()
    
    return redirect("/Admin-Fer")

@app.route("/Admin-Fer/supprimer/consommable/<int:id_cons>", methods=["POST"])
@login_required
def supprimer_consommable(id_cons):
    cursor = con.cursor()
    
    cursor.execute("DELETE FROM consommables WHERE id_cons = %s", (id_cons,))
    con.commit()
    flash("Consommable supprimé avec succès !", "success")
    
    cursor.close()
    
    return redirect("/Admin-Consommables")


@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    name = data.get("name")
    surname = data.get("surname")
    password = data.get("password")
    
    hashPassword = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT id_user FROM utilisateurs WHERE email = %s", (email,))
    user_exist = cursor.fetchone()
    
    if user_exist:
        return jsonify({"error": "Email déjà utilisé"}), 400
    
    cursor.execute("INSERT INTO utilisateurs (email, name, surname,password) VALUES (%s, %s, %s,%s)", (email, name, surname, hashPassword))
    
    con.commit()
    cursor.close()
    
    return jsonify({"message": f"Compte créé avec succès ! "})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    cursor = con.cursor(dictionary= True)
    cursor.execute('SELECT * FROM utilisateurs WHERE email = %s ', (email, ))
    user = cursor.fetchone()
    cursor.close()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        access_token = create_access_token(identity = email)
        refresh_token = create_refresh_token(identity = email)
    
        return jsonify({"message": "Connecté","access_token": access_token,"refresh_token": refresh_token}), 200
    else:
        return jsonify({"error": "Email ou mot de passe incorrect"}), 400
    
   
    
    return jsonify(access_token= access_token, refresh_token= refresh_token), 200

@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    new_token = create_access_token(identity=current_user)
    return jsonify(access_token = new_token), 200

@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as = current_user),200

@app.route("/logout", methods=["POST", "OPTIONS"])
@jwt_required()
def logout():
    token = get_jwt()
    jti = token['jti']
    blacklist_token.add(jti)
    return jsonify({'message':"Déconnecté"}), 200
    
    
@app.route('/')
def index():
    return "Server KAjy-Vy is running !"


@app.route('/analyze-drawing', methods=['POST'])
def analyze_drawing():
    data = request.get_json()

    svg_string = data.get('svg')
    hauteur = float(data.get('hauteur', 2))
    largeur = float(data.get('longueur', 1))
    type_structure = data.get('type_structure', 'auto').lower()
    
    type_bati = data.get('type_bati', '')
    type_cadre = data.get('type_cadre', '')
    type_deco = data.get('type_deco', '')
    type_tole = data.get('type_tole', '')
    type_volet= data.get('type_volet')

    png_path = svgToImage(svg_string)
    if not png_path:
        return jsonify({'error': 'Conversion SVG vers PNG échouée'}), 500

    if type_structure == 'porte':
        resultat = analyser_porte(png_path, hauteur, largeur,type_bati, type_cadre, type_tole, type_volet)
    elif type_structure == 'grille':
        resultat = analyser_grille(png_path, hauteur, largeur, type_cadre, type_deco, from_draw= True)
    
    else:
        return jsonify({'error': 'Type de structure invalide'}), 400

    resultat['image_preview'] = imageToBAse(png_path)

    return jsonify(resultat)

    
def svgToImage(svg_string, width=800, height=600):
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.svg', delete=False) as svg_file:
            svg_file.write(svg_string)
            svg_path = svg_file.name
            
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as png_file:
                png_path = png_file.name
                
        cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=width, output_height=height)
        
        os.unlink(svg_path)  # Supprimer le fichier SVG temporaire
        return png_path
    
    except Exception as e:
        print(f"Erreur lors de la conversion SVG vers PNG: {e}")
        try:
            img = Image.new('RGB', (width, height), color='white')
            draw = ImageDraw.Draw(img)
            
            draw.rectangle([50,50, width-50, height-50], outline='black', width=3)
            
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as png_file:
                png_path = png_file.name
                img.save(png_path, 'PNG')
            return png_path
        except Exception as e2:
            print(f"Erreur méthode de fallback , {e2}")
            return None

def imageToBAse(image_path):
    try:
        with open(image_path, "rb") as img_file:
            img_data = img_file.read()
            encoded_img = base64.b64encode(img_data).decode()
        return encoded_img
    except Exception as e:
        print(f"Erreur conversion base 64 : {e}")
        return None
    

# -------------------------------------------début type fer pour le picker----------------------------------------------------------

    
@app.route("/bati", methods=["GET"])
def typebati():
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT id_bati, type_bati FROM bati")
    data = cursor.fetchall()
    cursor.close()
    return jsonify(data)

@app.route("/cadre", methods=["GET"])
def typecadre_rectangle():
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT id_cadre, type_cadre FROM cadre")
    data = cursor.fetchall()
    cursor.close()
    return jsonify(data)

@app.route("/cadre-grille", methods=["GET"])
def typecadre_grille():
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT id_grille, type_cadre FROM cadre_grille")
    data = cursor.fetchall()
    cursor.close()
    return jsonify(data)

@app.route("/decoration", methods=["GET"])
def typedecoration():
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT id_decoration, type_decoration FROM decoration")
    data = cursor.fetchall()
    cursor.close()
    return jsonify(data)

@app.route("/tole", methods=["GET"])
def typetole():
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT id_tole, type_tole FROM tole")
    data = cursor.fetchall()
    cursor.close()
    return jsonify(data)
    
# -------------------------------------------fin type fer pour le picker----------------------------------------------------------

def prixBati(type_bati):
    cursor = con.cursor(dictionary=True)
    query = "SELECT prix_type, prix_peinture FROM bati WHERE type_bati = %s"
    cursor.execute(query, (type_bati,))
    result = cursor.fetchone()
    cursor.close()
    if result:
        return float(result['prix_type']), float(result['prix_peinture'])
    return 0, 0 

def prixCadreRectangle(type_cadre):
    cursor = con.cursor(dictionary=True)
    query = "SELECT prix_type, prix_peinture FROM cadre WHERE type_cadre = %s"
    cursor.execute(query, (type_cadre,))
    result = cursor.fetchone()
    cursor.close()
    if result:
        return float(result['prix_type']), float(result['prix_peinture'])
    return 0, 0

def prixCadreCarre(type_cadre):
    cursor = con.cursor(dictionary=True)
    query = "SELECT prix_type, prix_peinture FROM cadre_grille WHERE type_cadre = %s"
    cursor.execute(query, (type_cadre,))
    result = cursor.fetchone()
    cursor.close()
    if result:
        return float(result['prix_type']), float(result['prix_peinture'])
    return 0, 0

def prixDecoration(type_deco):
    cursor = con.cursor(dictionary=True)
    query = "SELECT prix_type, prix_peinture FROM decoration WHERE type_decoration = %s"
    cursor.execute(query, (type_deco,))
    result = cursor.fetchone()
    cursor.close()
    if result:
        return float(result['prix_type']), float(result['prix_peinture'])
    return 0, 0

def prixTole(type_tole):
    cursor = con.cursor(dictionary=True)
    query = "SELECT prix_type, prix_peinture FROM tole WHERE type_tole = %s"
    cursor.execute(query, (type_tole,))
    result = cursor.fetchone()
    cursor.close()
    if result:
        return float(result['prix_type']), float(result['prix_peinture'])
    return 0, 0

def prixConsommable(nom_cons):
    cursor = con.cursor(dictionary=True)
    query = "SELECT prix_cons FROM consommables WHERE nom_cons = %s"
    cursor.execute(query, (nom_cons,))
    result = cursor.fetchone()
    cursor.close()
    if result:
        return float(result['prix_cons'])
    return 0

def prixElectrode():
    return prixConsommable('Electrode')

def prixDisques():
    prix_ebarbeuse = prixConsommable('Disque ebarbeuse')
    prix_tronconneuse = prixConsommable('Disque Tronçoneuse')
    return prix_ebarbeuse + prix_tronconneuse



#---------------------------------------analyse d'image et dessin -------------------

def analyser_porte(image_path, hauteur_m, largeur_m,type_bati, type_cadre, type_tole, type_volet):
    try:
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 100, 200)
        
        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        rectangles_detectes = 0
        for contour in contours:
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.04 * peri, True)
            
            if len(approx) == 4:
                area = cv2.contourArea(contour)
                if area > 1000:  # Ignorer les petits rectangles parasites
                    rectangles_detectes += 1
        
        # Une porte doit avoir au moins 1 grand rectangle (le cadre principal)
        if rectangles_detectes < 1:
            return {'error': 'Aucune structure métallique détectée. Cette image ne semble pas être une porte/fenêtre. Veuillez réessayer.'}
        
        # Vérifier la présence de lignes longues et droites
        lignes = cv2.HoughLinesP(edges, 1, np.pi / 180,
                                 threshold=80,
                                 minLineLength=100,  # Augmenté à 100
                                 maxLineGap=15)
        
        if lignes is None or len(lignes) < 4:
            return {'error': 'Pas assez de lignes droites détectées. Une porte/fenêtre doit avoir des barres droites et longues.'}
        
       
        lignes_strictes = 0
        for ligne in lignes:
            x1, y1, x2, y2 = ligne[0]
            longueur = np.sqrt((x2-x1)**2 + (y2-y1)**2)
            
            if longueur < 100:  # Ignorer les lignes trop courtes
                continue
                
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            
            # Doit être très proche de l'horizontale ou verticale (±10°)
            if abs(angle) < 10 or abs(abs(angle) - 90) < 10 or abs(abs(angle) - 180) < 10:
                lignes_strictes += 1
        
        if lignes_strictes < 4:
            return {'error': 'Cette image ne contient pas les caractéristiques d\'une porte/fenêtre (lignes horizontales et verticales bien définies).'}

        hauteur_px, largeur_px = gray.shape[:2]

        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        svg_output_path = os.path.join(upload_folder, 'contours_porte.svg')
        with open(svg_output_path, 'w') as svg_file:
            svg_file.write('<svg xmlns="http://www.w3.org/2000/svg" version="1.1">\n')
            for contour in contours:
                points = " ".join([f"{pt[0][0]},{pt[0][1]}" for pt in contour])
                svg_file.write(f'<polyline points="{points}" fill="none" stroke="red" stroke-width="2"/>\n')
            svg_file.write('</svg>')

        lignes = cv2.HoughLinesP(edges, 1, np.pi / 180,
                                 threshold=100,
                                 minLineLength=50,
                                 maxLineGap=10)
        barres_cadre = []
        barres_deco = []

        if lignes is not None:
            for ligne in lignes:
                x1, y1, x2, y2 = ligne[0]
                angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                longueur_px = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)

                # conversion de px en cm
                if abs(angle) < 10:  # horizontale
                    longueur_cm = (longueur_px / largeur_px) * (largeur_m * 100)
                    barres_deco.append(longueur_cm)
                elif 80 < abs(angle) < 100:  # verticale
                    longueur_cm = (longueur_px / hauteur_px) * (hauteur_m * 100)
                    barres_deco.append(longueur_cm)
                else:  # oblique
                    diag_px = np.sqrt(hauteur_px**2 + largeur_px**2)
                    diag_cm = np.sqrt(hauteur_m**2 + largeur_m**2) * 100
                    longueur_cm = (longueur_px / diag_px) * diag_cm
                    barres_deco.append(longueur_cm)
                    
        long_fer_normale = 580  # cm
        
        if type_bati:
            prix_bati_normale, prix_peinture_bati = prixBati(type_bati)
        else:
            prix_bati_normale, prix_peinture_bati = 0, 0

        if type_cadre:
            prix_cadre_normale, prix_peinture_cadre = prixCadreRectangle(type_cadre)
        else:
            prix_cadre_normale, prix_peinture_cadre = 0, 0

        if type_tole:
            prix_tole_normale, prix_peinture_tole = prixTole(type_tole)
        else:
            prix_tole_normale, prix_peinture_tole = 0, 0

        baguette = prixConsommable('Electrode') * 20
        print( baguette)
        disque = prixDisques()
        print(disque)
        
        surface_tolecm2 = (hauteur_m * largeur_m)*10000
        long_tole=200
        larg_tole = 100
        total_surface_tole = long_tole * larg_tole
        
        nombres_toles = surface_tolecm2/total_surface_tole
        
        total_cadre = 2 * (hauteur_m + largeur_m) * 100
        total_bati = total_cadre
        if type_volet:
            if type_volet == '1':
                total_cadre= 2 * (hauteur_m + largeur_m) * 100
            elif type_volet == '2': 
                total_cadre= (2 * (hauteur_m + largeur_m) * 100) * 1.3
            elif type_volet == '3':
                total_cadre= (2 * (hauteur_m + largeur_m) * 100) * 2.6

        bati = math.ceil(((total_bati * prix_bati_normale) / long_fer_normale)/100)*100
        peinture_bati = math.ceil(((total_bati * prix_peinture_bati) / long_fer_normale)/100)*100

        cadre = math.ceil(((total_cadre * prix_cadre_normale) / long_fer_normale)/100)*100
        peinture_cadre = math.ceil(((total_cadre * prix_peinture_cadre) / long_fer_normale)/100)*100
        
        tole = math.ceil((nombres_toles * prix_tole_normale)/100)*100
        peinture_tole = math.ceil((nombres_toles * prix_peinture_tole)/100)*100

        total_prix = cadre + peinture_cadre + bati + peinture_bati + tole + peinture_tole+baguette+disque
        
        main_oeuvre = total_prix * 0.05
        prix = math.ceil((total_prix + main_oeuvre)/100)*100
        majoration = math.ceil((prix * 0.35)/100)*100
        prix_total = math.ceil((prix + majoration )/100)*100
        
        return {
            'type': 'Porte & fenêtre',
            'prix_total': round(prix_total),
           'types_selectionnes': { 
                'bati': type_bati or 'Non spécifié',
                'cadre': type_cadre or 'Non spécifié', 
                'tole': type_tole or 'Non spécifié'
            },
            'details': {
                 'bati': {
                    'type_bati': type_bati,
                    'longueur_totale_cm': round((total_bati/long_fer_normale), 1),
                    'prix_fer': round(bati),
                    'prix_peinture': round(peinture_bati)
                },
                'cadre': {
                    'type_cadre': type_cadre,
                    'longueur_totale_cm': round((total_cadre/long_fer_normale),1),
                    'prix_fer': round(cadre),
                    'prix_peinture': round(peinture_cadre)
                },
                'tole': {
                    'type_tole': type_tole,
                    'longueur_totale_cm': round(total_surface_tole,1),
                    'prix_fer': round(tole),
                    'prix_peinture': round(peinture_tole)
                },
                
                'main_oeuvre': round(main_oeuvre),
                'majoration_30p': round(majoration)
            },
            'barres_cadre': barres_cadre,
            
            'svg_path': 'contours_porte.svg',
            'message': 'Analyse porte terminée'
        }

    except Exception as e:
        return {'error': f'Erreur analyse porte: {str(e)}'}

def nettoyer_dessin(image_path):
    try:
        image = cv2.imread(image_path)
        if image is None:
            raise Exception("Impossible de lire l'image")
            
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        denoised = cv2.medianBlur(gray, 5)
        
        binary = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY_INV, 11, 2)
        
        kernel = np.ones((2,2), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
        
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        clean_image = np.zeros_like(gray)
        clean_image.fill(255)  # Fond blanc
        
        for contour in contours:
            epsilon = 0.02 * cv2.arcLength(contour, True)
            simplified_contour = cv2.approxPolyDP(contour, epsilon, True)
            
            cv2.drawContours(clean_image, [simplified_contour], -1, (0, 0, 0), 2)
        
        edges = cv2.Canny(clean_image, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, 
                               minLineLength=30, maxLineGap=10)
        
        final_image = np.zeros_like(gray)
        final_image.fill(255)  # Fond blanc
        
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                cv2.line(final_image, (x1, y1), (x2, y2), (0, 0, 0), 2)
        
        scale_percent = 150
        width = int(final_image.shape[1]* scale_percent/100)
        height = int (final_image.shape[0]* scale_percent/100)
        dim = (width, height)
        
        final_image= cv2.resize(final_image, dim, interpolation= cv2.INTER_CUBIC)
        
        clean_path = os.path.join(upload_folder, 'dessin_nettoye.png')
        cv2.imwrite(clean_path, final_image)
        
        return clean_path
        
    except Exception as e:
        print(f"Erreur nettoyage dessin: {e}")
        return image_path  
    
    
def analyser_grille(image_path, hauteur_m, largeur_m, type_cadre, type_deco, from_draw=False):
    try:
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 100, 200)
        
        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        rectangles_detectes = 0
        for contour in contours:
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.04 * peri, True)
            
            if len(approx) == 4:
                area = cv2.contourArea(contour)
                if 500 < area < 100000:  # Rectangles de taille moyenne
                    rectangles_detectes += 1
        
        
        # if rectangles_detectes < 3:
        #     return {'error': 'Aucune structure métallique détectée. Cette image ne semble pas être une grille de protection. Veuillez réessayer.'}
        
       
        lignes = cv2.HoughLinesP(edges, 1, np.pi / 180,
                                 threshold=60,
                                 minLineLength=80,
                                 maxLineGap=15)
        
        if lignes is None or len(lignes) < 8:
            return {'error': 'Pas assez de barres détectées pour une grille de protection.'}
        
        lignes_horizontales = 0
        lignes_verticales = 0
        
        for ligne in lignes:
            x1, y1, x2, y2 = ligne[0]
            longueur = np.sqrt((x2-x1)**2 + (y2-y1)**2)
            
            if longueur < 60:
                continue
                
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            
            if abs(angle) < 10 or abs(abs(angle) - 180) < 10:
                lignes_horizontales += 1
            elif 80 < abs(angle) < 100:
                lignes_verticales += 1
        
        # Une grille DOIT avoir des lignes dans les deux directions
        if lignes_horizontales < 3 or lignes_verticales < 3:
            return {'error': 'Cette image ne présente pas le quadrillage croisé (barres horizontales ET verticales) caractéristique d\'une grille de protection.'}

        hauteur_px, largeur_px = gray.shape[:2]

        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        svg_output_path = os.path.join(upload_folder, 'contours_grille.svg')
        with open(svg_output_path, 'w') as svg_file:
            svg_file.write('<svg xmlns="http://www.w3.org/2000/svg" version="1.1">\n')
            for contour in contours:
                points = " ".join([f"{pt[0][0]},{pt[0][1]}" for pt in contour])
                svg_file.write(f'<polyline points="{points}" fill="none" stroke="blue" stroke-width="2"/>\n')
            svg_file.write('</svg>')

        lignes = cv2.HoughLinesP(edges, 1, np.pi / 180,threshold=100, minLineLength=50,maxLineGap=10)
        barres_cadre = []
        barres_deco = []

        if lignes is not None:
            for ligne in lignes:
                x1, y1, x2, y2 = ligne[0]
                angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                longueur_px = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)

                # Conversion px → cm
                if abs(angle) < 15:  # horizontale
                    longueur_cm = (longueur_px / largeur_px) * (largeur_m * 100)
                    barres_deco.append(longueur_cm)
                elif 75 < abs(angle) < 105:  # verticale
                    longueur_cm = (longueur_px / hauteur_px) * (hauteur_m * 100)
                    barres_deco.append(longueur_cm)
                else:  # oblique
                    diag_px = np.sqrt(hauteur_px**2 + largeur_px**2)
                    diag_cm = np.sqrt(hauteur_m**2 + largeur_m**2) * 100
                    longueur_cm = (longueur_px / diag_px) * diag_cm
                    barres_deco.append(longueur_cm)

        long_fer_normale = 580  # cm

        if type_cadre:
            prix_cadre_normale, prix_peinture_cadre = prixCadreCarre(type_cadre)
        else:
            prix_cadre_normale, prix_peinture_cadre = 0, 0

        if type_deco and type_deco != 'aucun':
            prix_deco, prix_peinture_deco = prixDecoration(type_deco)
        else:
            prix_deco, prix_peinture_deco = 0, 0
        
        baguette=20000
        disque = 20000

        total_cadre = 2*(hauteur_m + largeur_m)*100
        
        if from_draw:
            total_deco = math.ceil((sum(barres_deco))/100)*100
        else:
            total_deco = math.ceil(((sum(barres_deco))/2)/100)*100

        cadre =math.ceil(((total_cadre * prix_cadre_normale) / long_fer_normale)/100)*100
        peinture_cadre = math.ceil(((total_cadre * prix_peinture_cadre) / long_fer_normale)/100)*100

        deco = math.ceil(((total_deco * prix_deco) / long_fer_normale)/100)*100
        peinture_deco = math.ceil(((total_deco * prix_peinture_deco) / long_fer_normale)/100)*100

        cadre_peinture = math.ceil((cadre + peinture_cadre + deco + peinture_deco + baguette+disque)/100)*100

        main_oeuvre = math.ceil((cadre_peinture * 0.05)/100)*100

        prix = math.ceil((cadre_peinture + main_oeuvre)/100)*100

        majoration = math.ceil((prix * 0.35)/100)*100

        prix_total = math.ceil((prix + majoration )/100)*100

        return {
            'type': 'Grille de protection',
            'prix_total': round(prix_total),
            'types_selectionnes': { 
                'cadre': type_cadre or 'Non spécifié',
                'decoration': type_deco or 'Non spécifié'
            },
            'details': {
                'cadre': {
                    'type_cadre': type_cadre,
                    'longueur_totale_cm': round((total_cadre/long_fer_normale),1),
                    'prix_fer': round(cadre),
                    'prix_peinture': round(peinture_cadre)
                },
                'decoration': {
                    'type_decoration': type_deco,
                    'longueur_totale_cm': round((total_deco/long_fer_normale),1),
                    'prix_fer': round(deco),
                    'prix_peinture': round(peinture_deco)
                },
                'main_oeuvre': round(main_oeuvre),
                'majoration_30p': round(majoration)
            },
            
            'svg_path': 'contours_grille.svg',
            'message': 'Analyse grille terminée'
        }

    except Exception as e:
        return {'error': f'Erreur analyse grille: {str(e)}'}


@app.route('/analyse', methods=['POST'])
def analyseImage():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    fichierImage = request.files['image']
    if fichierImage.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    pathImage = os.path.join(upload_folder, fichierImage.filename)
    fichierImage.save(pathImage)

    test_image = cv2.imread(pathImage)
    if test_image is None:
        return jsonify({'error': 'Cannot read image file'}), 400
    type_objet = request.form.get('type').lower()
    if type_objet not in ['porte', 'grille']:
        return jsonify({'error': 'Type d\'objet invalide. Utilisez: porte, grille'}), 400

    try:
        hauteur_m = float(request.form.get('hauteur', 2))
        largeur_m = float(request.form.get('largeur', 1))
        
        type_bati = request.form.get('type_bati', '')
        type_cadre = request.form.get('type_cadre', '')
        type_deco = request.form.get('type_deco', '')
        type_tole = request.form.get('type_tole', '')
        type_volet = request.form.get('type_volet', '')

        if type_objet == 'porte':
            resultat = analyser_porte(pathImage, hauteur_m, largeur_m,type_bati, type_cadre, type_tole, type_volet)

        elif type_objet == 'grille':
            resultat = analyser_grille(pathImage, hauteur_m, largeur_m, type_cadre, type_deco, from_draw=False)
        resultat['dimensions'] = {
            'hauteur_m': hauteur_m,
            'largeur_m': largeur_m
        }
        resultat['timestamp'] = str(np.datetime64('now'))
        return jsonify(resultat)
    except Exception as e:
        return jsonify({'error': f'Analyse échouée: {str(e)}'}), 500

@app.route('/upload/<path:filename>')
def getSVG(filename):
    return send_from_directory(upload_folder, filename)
    
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)