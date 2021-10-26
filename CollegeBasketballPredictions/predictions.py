import networkx as nx
import pandas as pd

teams_to_show = 50
pd.options.display.min_rows = teams_to_show

# source: https://www.sportsbookreviewsonline.com/scoresoddsarchives/ncaabasketball/ncaabasketballoddsarchives.htm
# Unfortunately, data only contains games up to March 5th
# TODO: improve data with web scraper

games = pd.read_excel("ncaa basketball 2020-21.xlsx", engine="openpyxl")

first_teams = games[games.index % 2 == 0][["Team", "Final"]]
second_teams = games[games.index % 2 != 0][["Team", "Final"]]

digraph = nx.DiGraph()
edges = []
for (_, team1), (_, team2) in zip(first_teams.iterrows(), second_teams.iterrows()):
    if team1.Final > team2.Final:
        edges.append((team2.Team, team1.Team, team1.Final-team2.Final))
    elif team2.Final > team1.Final:
        edges.append((team1.Team, team2.Team, team2.Final-team1.Final))
    else:
        print(f"undecided game: {team1} {team2}")
digraph.add_weighted_edges_from(edges)
team_rank = nx.pagerank(digraph)

team_rank_dict = {"Team":[], "Rank":[]}
for k, v in team_rank.items():
    team_rank_dict["Team"].append(k)
    team_rank_dict["Rank"].append(v)

team_rank_df = pd.DataFrame(team_rank_dict)
team_rank_df.sort_values(by=["Rank"], ascending=False).iloc[0:teams_to_show]