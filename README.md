# reforestation

>A simulation of tree growth in a forest. [<Click here to see it.>](zebengberg.github.io/reforestation)


## Motivation

After a forest is destroyed, new trees will begin to grow and compete for space. Initially, fast-growth trees will dominate the landscape. These trees will grow quickly but are not as hearty as their slower-growth counterparts. These slower-growth trees will take longer to establish a footprint in the forest, but they will survive for longer. Overtime, we expect a forest to transform from the fast-growth trees that initially spring-up to the old-growth trees that dominate a mature forest.


## Simulation

In [this simulation](zebengberg.github.io/reforestation), we have several different species of trees growing in a forest. The different species are distinguished with different colors, and each has its own growth rate and expected lifespan. These two quantities exist in opposition to one another: the faster a tree grows, the shorter its expected lifespan.

At each step, several actions take place.
- If available space exists, new trees are born in random positions. These new trees are assigned a species randomly.
- Each tree that already exists in the forest grows in a stochastic manner dependent on the growth rate of its underlying species.
- No tree is allowed to grow into another existing tree; trees should not overlap.
- Each tree has a small chance of dying. In this case, it will be removed from the forest in order to open up space for new tree growth.

Forest-wide metrics are displayed in the upper left-hand corner of the html canvas. The total area of all trees of a given species is displayed; these total areas are sorted to give a ranking of the species and to give an overall summary of the forest.

![sample](sample.png)

Every tree displayed on the html canvas is an instance of class `Tree`. The entire forest is a single instance of class `Forest`. This `Forest` class includes containers holding the individual `Tree` objects. `Forest` methods include `setClosestNeighborDist()`, which calculates the distance between each tree and its nearest neighbor. Another notable method is `clearCut()`, which kills all trees within a disk centered at a canvas mouse click generated by the user.


## Algorithm

The most computationally-interesting aspect of this program is the calculation of the nearest neighbor of each tree. Classically, problems involving neighbors in a network have been well-studied. In this particular project, I am tasked with an *all nearest neighbor*-style problem: for each tree, I must calculate the distance to the nearest neighbor. In the naive algorithm, if there are **n** trees, each tree would be compared with every other tree to find its nearest neighbor. This procedure would require **O(n^2)** steps. There are more efficient general procedures such as [*Vaidya's algorithm*](https://link.springer.com/article/10.1007/BF02187718) which require only **O(n log(n))** steps. This run-time is optimal up to a constant factor.

In this project, we need to calculate nearest neighbor distances in order to prevent trees from overlapping. Moreover, trees are constrained to have a maximum possible radius. This second property can be algorithmically exploited: If two trees are further apart than twice the maximum possible radius, then it will not be possible for these two trees to overlap after growing. In this way, we only need to calculate the distance between a given tree and those trees in the immediate vicinity.

To this end, we cover the forest with a collection of overlapping boxes. Each tree instantiated with a box index **(u, v)**, and the box at **(u, v)** contains all trees that are within twice the maximum radius of the trees with box index **(u, v)**. Specifically, the box at **(u, v)** contains all trees with box index of the form **(u + j, v + k)** for **j, k = -1, 0, 1**.

With these boxes in place, we must only calculate the distance between a tree and all other trees in its associated box. This algorithm now has a runtime of **O(n)**, where the implied constant depends on the maximum radius. In particular, if the maximum possible radius is **R**, the runtime of this algorithm is **O(nR^2)**.


## License

This project is released under the [MIT license](https://opensource.org/licenses/MIT).
