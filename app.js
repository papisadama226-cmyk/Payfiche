// Configuration de ton Webhook Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1513491854069469317/i3mOtYEw_MU2lorvLKmP-MTxZ479BmZ6oxe5rDV8BOUTyfWGmn90Rs3xZw83ORoRif94";

const locationInput = document.getElementById('location');
const geoStatus = document.getElementById('geoStatus');
const paymentForm = document.getElementById('paymentForm');
const submitBtn = document.getElementById('submitBtn');

// Fonction stricte d'exclusion si la localisation est refusée ou indisponible
function exclureUtilisateur(message) {
    alert(message);
    // Redirection immédiate pour forcer la sortie de la PWA
    window.location.href = "https://www.google.com";
}

// Enregistrement du Service Worker pour la PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker installé avec succès !', reg))
            .catch(err => console.error('Échec installation Service Worker', err));
    });
}

// Vérification de la géolocalisation dès l'accès à l'application
window.addEventListener('DOMContentLoaded', () => {
    if (!navigator.geolocation) {
        exclureUtilisateur("⚠️ Votre appareil ou navigateur ne supporte pas la géolocalisation obligatoire. Accès refusé.");
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Verrouillage des coordonnées dans le champ de saisie
            locationInput.value = `${lat}, ${lng}`;
            locationInput.style.color = "#2ecc71";
            locationInput.style.borderColor = "#2ecc71";
            
            geoStatus.textContent = "✅ Localisation obligatoire activée et validée.";
            geoStatus.style.color = "#2ecc71";
            
            // Activation du bouton de soumission
            submitBtn.disabled = false;
        },
        (error) => {
            // L'utilisateur a refusé l'accès au GPS ou le signal est introuvable -> Sortie immédiate
            exclureUtilisateur("❌ Accès refusé : La localisation en temps réel est obligatoire pour utiliser cette application. Fermeture...");
        },
        options
    );
});

// Traitement du formulaire et transmission à Discord
paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Sécurité supplémentaire : blocage si l'input a été modifié ou vidé artificiellement
    if (!locationInput.value || locationInput.value.includes("Vérification")) {
        exclureUtilisateur("Erreur critique de sécurité : Données de géolocalisation absentes.");
        return;
    }

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const amount = document.getElementById('amount').value;
    const coords = locationInput.value.replace(/\s+/g, '');

    // Génération du lien de géolocalisation pour Google Maps
    const googleMapsUrl = `https://www.google.com/maps?q=${coords}`;

    // Formatage professionnel du message Embed pour Discord
    const payload = {
        embeds: [{
            title: "📥 Nouvelle Fiche de Paiement Reçue",
            color: 14958426, // Code couleur correspondant au style de la PWA
            fields: [
                { name: "👤 Nom complet", value: name, inline: true },
                { name: "📞 Téléphone", value: phone, inline: true },
                { name: "💵 Montant", value: `${amount} FCFA`, inline: false },
                { name: "📍 Coordonnées GPS", value: coords, inline: true },
                { name: "🗺️ Localisation", value: `[Ouvrir l'itinéraire Google Maps](${googleMapsUrl})`, inline: false }
            ],
            footer: {
                text: `Date d'enregistrement : ${new Date().toLocaleString('fr-FR')}`
            }
        }]
    };

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours...";

        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("✅ Données de paiement et localisation transmises avec succès !");
            paymentForm.reset();
            // Rechargement immédiat pour réinitialiser la session de géolocalisation sécurisée
            window.location.reload();
        } else {
            alert("❌ Erreur serveur lors de la transmission des données.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Enregistrer & Envoyer";
        }
    } catch (err) {
        console.error(err);
        alert("⚠️ Erreur réseau : Impossible de joindre la passerelle Discord.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Enregistrer & Envoyer";
    }
});
