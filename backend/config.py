import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Daftar Lengkap 24 OPD / Instansi Pemda DIY
OPDS = [
    {
        "id": "sekda",
        "nama": "Sekretariat Daerah / Biro-biro",
        "news_query": "Sekretariat Daerah DIY",
        "maps_query": "Sekretariat Daerah DIY Kepatihan",
        "twitter_query": "Setda DIY",
    },
    {
        "id": "paniradya",
        "nama": "Paniradya Kaistimewan",
        "news_query": "Paniradya Kaistimewan DIY",
        "maps_query": "Paniradya Kaistimewan Yogyakarta",
        "twitter_query": "Paniradya Kaistimewan",
    },
    {
        "id": "dprd",
        "nama": "Sekretariat DPRD DIY",
        "news_query": "DPRD DIY Yogyakarta",
        "maps_query": "DPRD DIY Malioboro",
        "twitter_query": "DPRD DIY",
    },
    {
        "id": "inspektorat",
        "nama": "Inspektorat DIY",
        "news_query": "Inspektorat DIY Yogyakarta",
        "maps_query": "Inspektorat DIY Yogyakarta",
        "twitter_query": "Inspektorat DIY",
    },
    {
        "id": "dikpora",
        "nama": "Dinas Pendidikan, Pemuda dan Olahraga DIY",
        "news_query": "Dikpora DIY",
        "maps_query": "Dinas Dikpora DIY",
        "twitter_query": "Dikpora DIY",
    },
    {
        "id": "dinkes",
        "nama": "Dinas Kesehatan DIY",
        "news_query": "Dinas Kesehatan DIY",
        "maps_query": "Dinas Kesehatan Daerah Istimewa Yogyakarta",
        "twitter_query": "Dinas Kesehatan DIY",
    },
    {
        "id": "dinsos",
        "nama": "Dinas Sosial DIY",
        "news_query": "Dinas Sosial DIY",
        "maps_query": "Dinas Sosial Daerah Istimewa Yogyakarta",
        "twitter_query": "Dinas Sosial DIY",
    },
    {
        "id": "diskopukm",
        "nama": "Dinas Koperasi dan UKM DIY",
        "news_query": "Dinas Koperasi UKM DIY",
        "maps_query": "Dinas Koperasi UKM DIY Yogyakarta",
        "twitter_query": "Diskop UKM DIY",
    },
    {
        "id": "disperindag",
        "nama": "Dinas Perindustrian dan Perdagangan DIY",
        "news_query": "Disperindag DIY",
        "maps_query": "Dinas Perindustrian Perdagangan DIY Yogyakarta",
        "twitter_query": "Disperindag DIY",
    },
    {
        "id": "dpmptsp",
        "nama": "Dinas Penanaman Modal dan PTSP DIY",
        "news_query": "DPMPTSP DIY",
        "maps_query": "DPMPTSP DIY Yogyakarta",
        "twitter_query": "DPMPTSP DIY",
    },
    {
        "id": "disnakertrans",
        "nama": "Dinas Tenaga Kerja dan Transmigrasi DIY",
        "news_query": "Disnakertrans DIY",
        "maps_query": "Disnakertrans DIY Yogyakarta",
        "twitter_query": "Disnakertrans DIY",
    },
    {
        "id": "pupesdm",
        "nama": "Dinas PUP-ESDM DIY",
        "news_query": "Dinas PUP ESDM DIY",
        "maps_query": "Dinas PUP ESDM DIY Yogyakarta",
        "twitter_query": "PUP ESDM DIY",
    },
    {
        "id": "dishub",
        "nama": "Dinas Perhubungan DIY",
        "news_query": "Dinas Perhubungan DIY",
        "maps_query": "Dinas Perhubungan DIY Babarsari",
        "twitter_query": "Dishub DIY",
    },
    {
        "id": "dispertaru",
        "nama": "Dinas Pertanahan dan Tata Ruang DIY",
        "news_query": "Dispertaru DIY",
        "maps_query": "Dispertaru DIY Yogyakarta",
        "twitter_query": "Dispertaru DIY",
    },
    {
        "id": "dlhk",
        "nama": "Dinas Lingkungan Hidup dan Kehutanan DIY",
        "news_query": "DLHK DIY",
        "maps_query": "DLHK DIY Yogyakarta",
        "twitter_query": "DLHK DIY",
    },
    {
        "id": "dispar",
        "nama": "Dinas Pariwisata DIY",
        "news_query": "Dinas Pariwisata DIY",
        "maps_query": "Dinas Pariwisata DIY Malioboro",
        "twitter_query": "Dinas Pariwisata DIY",
    },
    {
        "id": "disbud",
        "nama": "Dinas Kebudayaan DIY",
        "news_query": "Dinas Kebudayaan DIY Kundha Kabudayan",
        "maps_query": "Dinas Kebudayaan DIY",
        "twitter_query": "Disbud DIY",
    },
    {
        "id": "dp3ap2",
        "nama": "Dinas Pemberdayaan Perempuan, Perlindungan Anak dan Pengendalian Penduduk DIY",
        "news_query": "DP3AP2 DIY",
        "maps_query": "DP3AP2 DIY Yogyakarta",
        "twitter_query": "DP3AP2 DIY",
    },
    {
        "id": "dispursip",
        "nama": "Dinas Perpustakaan dan Arsip Daerah DIY",
        "news_query": "DPAD DIY Grhatama Pustaka",
        "maps_query": "Grhatama Pustaka DPAD DIY",
        "twitter_query": "DPAD DIY",
    },
    {
        "id": "dispertan",
        "nama": "Dinas Pertanian dan Ketahanan Pangan DIY",
        "news_query": "Dinas Pertanian Ketahanan Pangan DIY",
        "maps_query": "Dinas Pertanian Ketahanan Pangan DIY",
        "twitter_query": "DPKP DIY",
    },
    {
        "id": "dkp",
        "nama": "Dinas Kelautan dan Perikanan DIY",
        "news_query": "Dinas Kelautan Perikanan DIY",
        "maps_query": "Dinas Kelautan dan Perikanan DIY",
        "twitter_query": "DKP DIY",
    },
    {
        "id": "diskominfo",
        "nama": "Dinas Komunikasi dan Informatika DIY",
        "news_query": "Diskominfo DIY",
        "maps_query": "Diskominfo DIY Danurejan",
        "twitter_query": "Diskominfo DIY",
    },
    {
        "id": "satpolpp",
        "nama": "Satuan Polisi Pamong Praja DIY",
        "news_query": "Satpol PP DIY",
        "maps_query": "Satuan Polisi Pamong Praja DIY",
        "twitter_query": "Satpol PP DIY",
    },
    {
        "id": "badan_daerah",
        "nama": "Badan-badan Daerah DIY",
        "news_query": "Bappeda DIY OR BPBD DIY OR BPKAD DIY",
        "maps_query": "Bappeda DIY Yogyakarta",
        "twitter_query": "BPBD DIY",
    },
]