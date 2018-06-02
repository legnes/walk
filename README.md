# walk
# Sam Engel
#
# This is the start of a simulation/animation aimed at the question:
# Can we use Monte Carlo methods to reliably fill a discretely subdivided
# space with one single, randomly-generated closed path?
# Also: How does the mode of propagation of the path affect success/failure?
# (Note: the method attempted here largely fails to complete the challenge.)
#
# Subdivides a canvas into tiles,
# randomly populates the canvas by sequentially assigning each tile a direction,
# which points to the next tile in the series (forming a linked list),
# then plays an animation of one path through the linked list in a new color.
# (Note: the animation plays after completion of the population phase.
# This may take some time.)
#
# The population stage will attempt to maintain one closed path through all
# tiles, but, when it gets stuck, will reassign or write over a tile's
# assignment.
#
# The program allows for several different kinds of path propagation.
# The world is infinite, i.e. edges loop back around like in pac-man.
