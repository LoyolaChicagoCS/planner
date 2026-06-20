#!/usr/bin/env python3
"""Add roadmaps to Communication and Business program JSON files."""
import json, os

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def process(filename, build):
    path = os.path.join(DATA_DIR, filename)
    with open(path) as f: data = json.load(f)
    lookup = {c['id'] for c in data.get('courses', [])}
    def r(code, credits=3):
        _id = code.replace(' ', '')
        for suffix in ['', 'biz', 'comm']:
            if _id + suffix in lookup: return {'ref': _id + suffix}
        return {'isElective': True, 'label': code, 'credits': credits}
    def e(label, credits=3): return {'isElective': True, 'label': label, 'credits': credits}
    data['roadmap'] = build(r, e)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2); f.write('\n')
    print(f'  updated {filename}')

# ══ SCHOOL OF COMMUNICATION ══════════════════════════════════════════════════

# ── Advertising & Public Relations BA ────────────────────────────────────────
process('advertising-public-relations-ba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':3,'items':[
    r('COMM 175')]},
  {'year':1,'semester':'Spring','credits':6,'items':[
    r('COMM 200'), e('COMM 210 or COMM 211 — Principles of PR or Advertising')]},
  {'year':2,'semester':'Fall','credits':9,'items':[
    e('COMM 211 or COMM 210 — Principles of Advertising or PR'), r('COMM 213'), r('COMM 215')]},
  {'year':2,'semester':'Spring','credits':6,'items':[
    r('COMM 250'), r('MARK 201')]},
  {'year':3,'semester':'Fall','credits':9,'items':[
    r('COMM 346'), e('Concentration Course 1'), e('Concentration Course 2')]},
  {'year':3,'semester':'Spring','credits':4,'items':[
    r('COMM 100',1), e('Concentration Course 3')]},
  {'year':4,'semester':'Fall','credits':6,'items':[
    e('New Media Course'), r('COMM 391')]},
  {'year':4,'semester':'Spring','credits':6,'items':[
    e('COMM 386 Capstone or COMM 391 Internship'), e('Elective Course')]},
])

# ── Advertising Creative BA ───────────────────────────────────────────────────
process('advertising-creative-ba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':3,'items':[
    r('COMM 175')]},
  {'year':1,'semester':'Spring','credits':6,'items':[
    r('COMM 200'), r('COMM 211')]},
  {'year':2,'semester':'Fall','credits':9,'items':[
    r('COMM 210'), r('COMM 213'), r('COMM 250')]},
  {'year':2,'semester':'Spring','credits':9,'items':[
    r('COMM 214'), r('COMM 215'), r('MARK 201')]},
  {'year':3,'semester':'Fall','credits':6,'items':[
    r('COMM 290'), r('COMM 346')]},
  {'year':3,'semester':'Spring','credits':7,'items':[
    r('COMM 100',1), r('COMM 266'), e('COMM 330 or COMM 329 — Advertising Design')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    e('New Media Course'), r('COMM 344'), r('COMM 391')]},
  {'year':4,'semester':'Spring','credits':6,'items':[
    r('COMM 389'), e('Elective Course')]},
])

# ── Communication Studies BA ──────────────────────────────────────────────────
process('communication-studies-ba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':3,'items':[
    r('COMM 175')]},
  {'year':1,'semester':'Spring','credits':6,'items':[
    r('COMM 200'), r('COMM 272')]},
  {'year':2,'semester':'Fall','credits':6,'items':[
    e('COMM 215 or COMM 360 — Ethics'), r('COMM 273')]},
  {'year':2,'semester':'Spring','credits':6,'items':[
    r('COMM 240'), r('COMM 271')]},
  {'year':3,'semester':'Fall','credits':7,'items':[
    r('COMM 100',1), e('Concentration Course 1'), e('Concentration Course 2')]},
  {'year':3,'semester':'Spring','credits':6,'items':[
    e('COMM 361/365/367/368 — Intensive Methods'), e('Concentration Course 3')]},
  {'year':4,'semester':'Fall','credits':6,'items':[
    e('Major Elective'), e('Application Course')]},
  {'year':4,'semester':'Spring','credits':3,'items':[
    r('COMM 390')]},
])

# ── Film & Media Production BA ────────────────────────────────────────────────
process('film-media-production-ba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':6,'items':[
    r('COMM 201'), r('COMM 274')]},
  {'year':1,'semester':'Spring','credits':3,'items':[
    r('COMM 135')]},
  {'year':2,'semester':'Fall','credits':6,'items':[
    r('COMM 130'), e('Media Studies Elective')]},
  {'year':2,'semester':'Spring','credits':6,'items':[
    r('COMM 200'), r('COMM 202')]},
  {'year':3,'semester':'Fall','credits':7,'items':[
    r('COMM 100',1), e('COMM 203 or COMM 324 — Cinema History or Film Genre'), e('Production Elective')]},
  {'year':3,'semester':'Spring','credits':6,'items':[
    e('Production Elective'), e('Advanced Production Elective')]},
  {'year':4,'semester':'Fall','credits':6,'items':[
    r('COMM 350'), e('COMM 394 — Film & Digital Media Internship')]},
  {'year':4,'semester':'Spring','credits':3,'items':[
    e('Major Capstone Course')]},
])

# ── Multimedia Journalism BA ──────────────────────────────────────────────────
process('multimedia-journalism-ba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':6,'items':[
    r('COMM 145'), r('COMM 175')]},
  {'year':1,'semester':'Spring','credits':6,'items':[
    r('COMM 200'), r('COMM 205')]},
  {'year':2,'semester':'Fall','credits':3,'items':[
    r('COMM 208')]},
  {'year':2,'semester':'Spring','credits':6,'items':[
    r('COMM 279'), e('Major Intermediate Course')]},
  {'year':3,'semester':'Fall','credits':7,'items':[
    r('COMM 100',1), r('COMM 215'), e('Major Intermediate Course')]},
  {'year':3,'semester':'Spring','credits':9,'items':[
    r('COMM 282'), r('COMM 362'), e('Major Advanced Course')]},
  {'year':4,'semester':'Fall','credits':6,'items':[
    r('COMM 392'), e('Major Advanced Course')]},
  {'year':4,'semester':'Spring','credits':3,'items':[
    e('Major Advanced Course')]},
])

# ── Public Communication & Advocacy BA ───────────────────────────────────────
process('public-communication-advocacy-ba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':3,'items':[
    r('COMM 175')]},
  {'year':1,'semester':'Spring','credits':6,'items':[
    r('COMM 101'), r('COMM 200')]},
  {'year':2,'semester':'Fall','credits':6,'items':[
    e('COMM 215 or COMM 360 — Ethics'), r('COMM 227')]},
  {'year':2,'semester':'Spring','credits':6,'items':[
    r('COMM 268'), e('COMM 130/135/275 — Production or Web Design')]},
  {'year':3,'semester':'Fall','credits':7,'items':[
    r('COMM 100',1), r('COMM 230'), r('COMM 231')]},
  {'year':3,'semester':'Spring','credits':6,'items':[
    r('COMM 300'), e('COMM 201/220/226/272 — Media or Rhetoric or Intercultural')]},
  {'year':4,'semester':'Fall','credits':6,'items':[
    r('COMM 306'), e('COMM 367/368/240 — Research Methods')]},
  {'year':4,'semester':'Spring','credits':3,'items':[
    r('COMM 309')]},
])

# ── Sports Media BA ───────────────────────────────────────────────────────────
process('sports-media-ba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':6,'items':[
    r('COMM 145'), r('COMM 175')]},
  {'year':1,'semester':'Spring','credits':6,'items':[
    r('COMM 200'), r('SPRT 130')]},
  {'year':2,'semester':'Fall','credits':6,'items':[
    r('COMM 205'), r('COMM 215')]},
  {'year':2,'semester':'Spring','credits':7,'items':[
    r('COMM 100',1), r('COMM 256'), r('COMM 265')]},
  {'year':3,'semester':'Fall','credits':6,'items':[
    r('COMM 242'), r('COMM 282')]},
  {'year':3,'semester':'Spring','credits':6,'items':[
    r('COMM 243'), e('Sports Media Elective')]},
  {'year':4,'semester':'Fall','credits':3,'items':[
    e('Sports Media Elective')]},
  {'year':4,'semester':'Spring','credits':3,'items':[
    r('COMM 395')]},
])

# ══ QUINLAN SCHOOL OF BUSINESS ════════════════════════════════════════════════

# ── Accounting BBA ────────────────────────────────────────────────────────────
process('accounting-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':7,'items':[
    r('ACCT 201'), r('ECON 202'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), r('ACCT 303'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':15,'items':[
    r('ACCT 304'), r('ACCT 311'), r('MGMT 201'), r('SCMG 232'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':12,'items':[
    r('ACCT 328'), r('COMM 103'), r('MARK 201'), e('ACCT Elective')]},
  {'year':3,'semester':'Spring','credits':12,'items':[
    e('FINC 301 or FINC 334 — Business Finance'), e('INFS 343 or ECON 346 — Business Analytics'), r('ETHC 341'), e('ACCT Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('ACCT 317'), r('LREB 315'), e('Writing Intensive Course')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('ACCT Elective'), e('Global Awareness Course')]},
])

# ── Accounting and Analytics BBA ──────────────────────────────────────────────
process('accounting-analytics-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':8,'items':[
    r('ACCT 201'), r('ECON 202'), r('QUIN 202',2)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), r('ACCT 303'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':15,'items':[
    r('ACCT 311'), r('INFS 346'), r('MGMT 201'), r('SCMG 232'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':12,'items':[
    r('ACCT 328'), r('COMM 103'), r('MARK 201'), e('Analytics Elective')]},
  {'year':3,'semester':'Spring','credits':12,'items':[
    r('FINC 301'), e('INFS 343 or ECON 346 — Business Analytics'), r('ETHC 341'), e('Analytics Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('ACCT 317'), r('LREB 315'), e('Writing Intensive Course')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('Global Awareness Course'), e('Analytics Elective')]},
])

# ── Economics BBA ─────────────────────────────────────────────────────────────
process('economics-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':7,'items':[
    r('ACCT 201'), r('ECON 202'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('ECON 303'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':12,'items':[
    r('ECON 304'), r('MGMT 201'), r('SCMG 232'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':9,'items':[
    r('MARK 201'), r('COMM 103'), e('ECON Elective')]},
  {'year':3,'semester':'Spring','credits':12,'items':[
    r('ETHC 341'), r('FINC 301'), e('INFS 343 or ECON 346 — Business Analytics'), e('ECON Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), e('Writing Intensive Course'), e('ECON Elective')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('Global Awareness Course'), e('ECON Elective')]},
])

# ── Entrepreneurship BBA ──────────────────────────────────────────────────────
process('entrepreneurship-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':10,'items':[
    r('ACCT 201'), r('ECON 202'), r('ENTR 201'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':8,'items':[
    r('ACCT 202'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':9,'items':[
    r('MGMT 201'), r('SCMG 232'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':9,'items':[
    r('MARK 201'), r('COMM 103'), e('ENTR Elective')]},
  {'year':3,'semester':'Spring','credits':12,'items':[
    r('FINC 301'), e('INFS 343 or ECON 346 — Business Analytics'), r('ETHC 341'), e('ENTR Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('ENTR 345'), r('LREB 315'), e('Writing Intensive Course')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('ENTR 390'), r('MGMT 304'), e('Global Awareness Course')]},
])

# ── Finance BBA ───────────────────────────────────────────────────────────────
process('finance-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':10,'items':[
    r('ECON 201'), r('INFS 247'), e('MATH 130 or MATH 161',4), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':7,'items':[
    r('ECON 202'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':8,'items':[
    r('ACCT 201'), r('FINC 334'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':9,'items':[
    r('ACCT 202'), r('SCMG 232'), r('FINC 335')]},
  {'year':3,'semester':'Fall','credits':15,'items':[
    r('COMM 103'), r('MGMT 201'), r('ECON 303'), e('Business Writing Intensive'), e('FINC Elective')]},
  {'year':3,'semester':'Spring','credits':12,'items':[
    r('ETHC 341'), e('INFS 343 or ECON 346 — Business Analytics'), r('MARK 201'), e('FINC Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), e('Writing Intensive Course'), e('FINC Elective')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('Global Awareness Course'), e('FINC Elective')]},
])

# ── Human Resource Management BBA ─────────────────────────────────────────────
process('human-resource-management-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':7,'items':[
    r('ACCT 201'), r('ECON 202'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), r('HRER 201'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':9,'items':[
    r('MGMT 201'), r('SCMG 232'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':12,'items':[
    r('FINC 301'), r('MARK 201'), r('COMM 103'), e('HRER Elective')]},
  {'year':3,'semester':'Spring','credits':9,'items':[
    e('INFS 343 or ECON 346 — Business Analytics'), r('ETHC 341'), e('HRER Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), e('Writing Intensive Course'), e('HRER Elective')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('Global Awareness Course'), e('HRER Elective')]},
])

# ── Information Systems & Analytics BBA ───────────────────────────────────────
process('information-systems-analytics-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':7,'items':[
    r('ACCT 201'), r('ECON 202'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), r('INFS 346'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':12,'items':[
    r('MGMT 201'), r('SCMG 232'), r('INFS 347'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':12,'items':[
    r('MARK 201'), r('COMM 103'), r('INFS 343'), e('INFS Programming Elective')]},
  {'year':3,'semester':'Spring','credits':9,'items':[
    r('FINC 301'), r('ETHC 341'), r('INFS 360')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), e('Writing Intensive Course'), e('INFS Elective')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('Global Awareness Course'), e('INFS Elective')]},
])

# ── International Business BBA ────────────────────────────────────────────────
process('international-business-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':10,'items':[
    r('ACCT 201'), r('SCMG 232'), r('IBUS 201'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('MGMT 201'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':9,'items':[
    r('ECON 202'), r('MARK 201'), e('International Business Elective')]},
  {'year':3,'semester':'Fall','credits':12,'items':[
    r('COMM 103'), r('FINC 301'), r('IBUS 315'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Spring','credits':9,'items':[
    e('INFS 343 or ECON 346 — Business Analytics'), r('ETHC 341'), e('International Business Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), e('Writing Intensive Course'), e('International Business Elective')]},
  {'year':4,'semester':'Spring','credits':6,'items':[
    r('MGMT 304'), e('International Business Elective')]},
])

# ── Management BBA ────────────────────────────────────────────────────────────
process('management-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':7,'items':[
    r('ACCT 201'), r('ECON 202'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('MGMT 201'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':9,'items':[
    r('FINC 301'), r('HRER 201'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':12,'items':[
    r('COMM 103'), r('MARK 201'), r('MGMT 360'), r('SCMG 232')]},
  {'year':3,'semester':'Spring','credits':9,'items':[
    r('ETHC 341'), e('INFS 343 or ECON 346 — Business Analytics'), e('MGMT Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), e('Writing Intensive Course'), e('MGMT Elective')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('Global Awareness Course'), e('MGMT Elective')]},
])

# ── Marketing BBA ─────────────────────────────────────────────────────────────
process('marketing-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':10,'items':[
    r('ACCT 201'), r('ECON 202'), r('MARK 201'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('QUIN 202',2), e('MARK Elective')]},
  {'year':2,'semester':'Spring','credits':12,'items':[
    r('MARK 310'), r('MGMT 201'), r('SCMG 232'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':9,'items':[
    r('COMM 103'), r('FINC 301'), r('MARK 311')]},
  {'year':3,'semester':'Spring','credits':9,'items':[
    r('ETHC 341'), e('INFS 343 or ECON 346 — Business Analytics'), r('MARK 380')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), r('MARK 390'), e('Writing Intensive Course')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('Global Awareness Course'), e('MARK Elective')]},
])

# ── Sport Management BBA ──────────────────────────────────────────────────────
process('sport-management-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':10,'items':[
    r('ACCT 201'), r('ECON 202'), r('SPRT 130'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 202'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('MARK 201'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':9,'items':[
    r('MGMT 201'), r('SCMG 232'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':12,'items':[
    r('COMM 103'), r('FINC 301'), e('SPRT Elective'), e('SPRT Elective')]},
  {'year':3,'semester':'Spring','credits':9,'items':[
    r('ETHC 341'), e('INFS 343 or STAT 103 — Business Analytics'), e('SPRT Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), e('Writing Intensive Course'), e('SPRT Elective')]},
  {'year':4,'semester':'Spring','credits':9,'items':[
    r('MGMT 304'), e('Global Awareness Course'), e('SPRT Elective')]},
])

# ── Supply Chain Management BBA ───────────────────────────────────────────────
process('supply-chain-management-bba.json', lambda r,e: [
  {'year':1,'semester':'Fall','credits':9,'items':[
    r('ECON 201'), r('INFS 247'), r('MATH 110'), r('QUIN 101',0)]},
  {'year':1,'semester':'Spring','credits':7,'items':[
    r('ECON 202'), r('SCMG 232'), r('QUIN 102',1)]},
  {'year':2,'semester':'Fall','credits':11,'items':[
    r('ACCT 201'), e('ISSCM 241 or STAT 103 — Business Statistics'), r('SCMG 338'), r('QUIN 202',2)]},
  {'year':2,'semester':'Spring','credits':12,'items':[
    r('ACCT 202'), r('MGMT 201'), r('SCMG 340'), e('Business Writing Intensive')]},
  {'year':3,'semester':'Fall','credits':9,'items':[
    r('MARK 201'), r('COMM 103'), e('SCMG Elective')]},
  {'year':3,'semester':'Spring','credits':12,'items':[
    r('ETHC 341'), r('FINC 301'), e('INFS 343 or ECON 346 — Business Analytics'), e('SCMG Elective')]},
  {'year':4,'semester':'Fall','credits':9,'items':[
    r('LREB 315'), e('Writing Intensive Course'), e('SCMG Elective')]},
  {'year':4,'semester':'Spring','credits':6,'items':[
    r('MGMT 304'), e('SCMG Elective')]},
])

print('Done!')
