var vdbBench = (function (vdbBench) {
    vdbBench._module.directive('vdbVisualization', function () {
        var OPEN_BRACKET = "(";
        var CLOSE_BRACKET = ")";
        var OPEN_SQUARE_BRACKET = "[";
        var CLOSE_SQUARE_BRACKET = "]";
        var COMMA = ",";
        var COLON = ":";
        var HYPHEN = "-";
        var UNDERSCORE = "_";
        var SPACE = " ";
        var DOT = ".";

        var LINKS = "_links";

        var TOP_MARGIN = 100;
        var DEPTH_HEIGHT = 100;
        var TRANSITION_DURATION = 750;
        var IMAGE_X = -16;
        var IMAGE_Y = -40;

        var SVG_ELEMENT = "svg";
        var GROUP_ELEMENT = "g";
        var SVG_PATH = "path";
        var SVG_CIRCLE = "circle";
        var SVG_RECTANGLE = "rect";
        var SVG_TRANSFORM = "transform";
        var SVG_DATA_ELEMENT = "d";
        var SVG_TRANSLATE = "translate";
        var SVG_SCALE = "scale";

        var CSS_CLASS = "class";
        var CSS_FILL = "fill";
        var CSS_FILL_OPACITY = "fill-opacity";
        var CSS_WIDTH = "width";
        var CSS_HEIGHT = "height";
        var CSS_SELECTED_CLASS = "node-selected";

        var JS_NO_CHILDREN = "_children";
        var JS_CHILDREN = "children";

        var XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
        var XLINK = "xlink";
        var HTML_XLINK_REF = "xlink:href";
        var HTML_HREF = "href";
        var HTML_X = "x";
        var HTML_X0 = "x0";
        var HTML_Y = "y";
        var HTML_Y0 = "y0";
        var HTML_WIDTH = "width";
        var HTML_HEIGHT = "height";
        var HTML_RADIUS = "r";
        var HTML_IMAGE = "image";
        var HTML_TEXT = "text";
        var HTML_DX = "dx";
        var HTML_DY = "dy";
        var HTML_TEXT_ANCHOR = "text-anchor";
        var HTML_CLICK = "click";

        var MIDDLE = "middle";
        var NODE = "node";
        var LINK = "link";
        var ID = "id";

        var NODE_ID_PREFIX = GROUP_ELEMENT + HYPHEN + NODE;

        return {
            // used as element only
            restrict: 'E',
            // isolated scope
            scope: {
                vdb: '=',
                height: '=',
                width: '='
            },
            link: function (scope, element, attrs) {

                var margin = {
                    top: 20,
                    right: 120,
                    bottom: 20,
                    left: 120
                };
                var width = scope.width - margin.right - margin.left;
                var height = scope.height - margin.top - margin.bottom;

                var tree = d3.layout.tree().size([width, height]);

                /*
                 * Create the svg canvas by selecting the 'div' of the widget and
                 * appending an 'svg' div and inside that a 'g' div
                 */
                var svg = d3.select(element[0]).append(SVG_ELEMENT)
                    .attr("width", width + margin.right + margin.left)
                    .attr("height", height + margin.top + margin.bottom);

                /*
                 * Create the root group element of the svg
                 */
                var svgGroup = svg.append(GROUP_ELEMENT)
                    .attr(SVG_TRANSFORM, SVG_TRANSLATE + OPEN_BRACKET + margin.left + COMMA + margin.top + CLOSE_BRACKET);

                scope.$watch('vdb', function (newVdb, oldVdb) {
                    // if 'vdb' is undefined, exit
                    if (!newVdb || newVdb == oldVdb) {
                        return;
                    }

                    /*
                     * clear the elements inside of the directive
                     */
                    svgGroup.selectAll('*').remove();

                    var treeData = prepare(newVdb.clone().plain());

                    /*
                     * Diagonal generator
                     * Projection determines the location of the source and target points
                     * of the diagonal line to be drawn.
                     */
                    var diagonal = d3.svg.diagonal().projection(function (node) {
                        return [node.x, node.y];
                    });

                    /*
                     * Create zoom behaviour and assign the zoom listener callback
                     */
                    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3])
                                        .on("zoom", function() {
                                            svgGroup.attr(SVG_TRANSFORM,
                                                                    SVG_TRANSLATE + OPEN_BRACKET +
                                                                    d3.event.translate + CLOSE_BRACKET +
                                                                    SVG_SCALE + OPEN_BRACKET +
                                                                    d3.event.scale + CLOSE_BRACKET);
                                        });

                    /*
                     * Assign the selection listener to the click event of the svg
                     * Call an initial zoom on the svg
                     */
                    svg.on(HTML_CLICK, selectionCallback).call(zoomListener);

                    root = treeData;

                    update(root);

                    function prepare(dataObject) {
                        var newDataObj = {};

                        for (var key in dataObject) {
                            var value = dataObject[key];

                            // _links must be checked first since its an array
                            if (key == LINKS) {
                                newDataObj.self = value[0].href;
                            } else if (typeof(value) == 'string' || typeof(value) == 'number' ||
                                Object.prototype.toString.call(value) === '[object Array]') {
                                newDataObj[key] = value; 
                            } else if (typeof(value) == 'object') {
                                var child = prepare(value);
                                (newDataObj._children || (newDataObj._children = [])).push(child);
                                child.parent = newDataObj;
                            }
                        }

                        return newDataObj;
                    }

                    /**
                     * Updates all the new, updated and removed nodes
                     *
                     * The source is the node at the "top" of the section
                     * being explanded/collapsed. Normally, this would be root
                     * but when a node is clicked on to be expanded then it
                     * would be the clicked node.
                     */
                    function update(source) {
                        if (source == null)
                            return;

                        /*
                         * The layout converts the hierarchy of data nodes
                         * presented by root into an array of tree layout nodes
                         */
                        var nodes = tree.nodes(root).reverse();

                        // Normalize for fixed-depth.
                        nodes.forEach(function (node) {
                            node.y = node.depth * DEPTH_HEIGHT + TOP_MARGIN;
                        });

                        /*
                         * Select all existing nodes
                         */
                        var nodeSelection = svgGroup.selectAll("g.node");

                        /*
                         * Map and append all new nodes from the data array
                         * to the node selection
                         */
                        var updateNodeSelection = nodeSelection.data(nodes, function (node) {
                            // self link will be unique while the id is not necessarily
                            return node.self;
                        });

                        /*
                         * Selection of new nodes being added to layout
                         */
                        var enterNodes = updateNodeSelection.enter();

                        /*
                         * Add group element to enter nodes
                         */
                        var enterNodesGroup = enterNodes.append(GROUP_ELEMENT);

                        /*
                         * Adds the
                         * transform for x,y
                         * node group id
                         * click handler to new nodes
                         */
                        enterNodesGroup.attr("class", "node")
                            .attr(SVG_TRANSFORM, function (node) {
                                return SVG_TRANSLATE + OPEN_BRACKET + source.x + COMMA + source.y + CLOSE_BRACKET;
                            })
                            .attr(ID, function (node) {
                                return NODE_ID_PREFIX + node.self;
                            })
                            .on(HTML_CLICK, selectionCallback);

                        /*
                         * Append the label to each new node
                         *
                         * text-anchor="middle" will anchor the text using the centre
                         * of the label at the location specified by the x attribute
                         *
                         * Note: the y and dy attributes locate the text using the
                         *          bottom-left of the text block
                         */
                        enterNodesGroup.append(HTML_TEXT)
                            .attr(HTML_TEXT_ANCHOR, MIDDLE)
                            .attr(HTML_DY, IMAGE_Y - 5)
                            .style(CSS_FILL_OPACITY, 1)
                            .text(nodeLabelCallback);

                        /*
                         * Centre the icon above the circle
                         */
                        enterNodesGroup.append(HTML_IMAGE)
                            .attr(HTML_X, IMAGE_X)
                            .attr(HTML_Y, IMAGE_Y)
                            .each(imageResourceCallback);

                        /*
                         * Add children indicator circles below the image 
                         */
                        enterNodesGroup.append(SVG_CIRCLE)
                            .attr(HTML_RADIUS, 1e-6)
                            .style(CSS_FILL, childStatusCallback)
                            .on(HTML_CLICK, function (node) {
                                if (node.children != null) {
                                    node._children = node.children;
                                    node.children = null;
                                } else {
                                    node.children = node._children;
                                    node._children = null;
                                }

                                update(node);

                                // Stop selection firing
                                d3.event.stopPropagation();
                            });

                        /*
                         * Animate new nodes, ie. child nodes being displayed after expanding parent, 
                         * using a transition. This will move the new nodes from parent nodes to their
                         * final destination.
                         */
                        var nodeUpdate = updateNodeSelection.transition()
                            .duration(TRANSITION_DURATION)
                            .attr(SVG_TRANSFORM, function(node) {
                                return SVG_TRANSLATE + OPEN_BRACKET + node.x + COMMA + node.y + CLOSE_BRACKET;
                            });

                        /*
                         * All circles currently being updated have their radius enlarged to their
                         * destination visible size.
                         */
                        nodeUpdate.select(SVG_CIRCLE)
                            .attr(HTML_RADIUS, 4.5)
                            .style(CSS_FILL, childStatusCallback);

                        /*
                         * Animate the removal of nodes being removed from the diagram
                         * when a parent node is contracted.
                         */
                        var nodeExit = updateNodeSelection.exit().transition()
                            .duration(TRANSITION_DURATION)
                            .attr(SVG_TRANSFORM, function(node) {
                                return SVG_TRANSLATE + OPEN_BRACKET + source.x + COMMA + source.y + CLOSE_BRACKET;
                            })
                            .remove();

                        /*
                         * Make the removed nodes circles too small to be visible
                         */
                        nodeExit.select(SVG_CIRCLE)
                            .attr(HTML_RADIUS, 1e-6);

                        /*
                         * Update the locations of all remaining nodes based on where
                         * the layout has now located them
                         */
                        nodes.forEach(function(node) {
                            node.x0 = node.x;
                            node.y0 = node.y;
                        });

                        updateLinks(source, nodes);
                    }

                    function selectionCallback (node) {
                        if (! d3.event.shiftKey) {
                            /*
                             * As long as the shift key is not pressed, remove all selected
                             * elements by finding all elements with the css selected class
                             */
                            svgGroup.selectAll(DOT + CSS_SELECTED_CLASS).remove();
                        }

                        var id = this.id;
                        try {
                            if (! id)
                                return;

                            if (! id.startsWith(NODE_ID_PREFIX))
                                return;

                            var boundingWidth = this.getBBox().width;
                            var boundingHeight = this.getBBox().height;

                            d3.select(this).insert(SVG_RECTANGLE, HTML_TEXT)
                                             .attr(HTML_X, -(boundingWidth / 2) - 5)
                                             .attr(HTML_Y, -boundingHeight)
                                             .attr(HTML_WIDTH, boundingWidth + 10)
                                             .attr(HTML_HEIGHT, boundingHeight)
                                             .attr(CSS_CLASS, CSS_SELECTED_CLASS);
                        } finally {
                            // Stop propagration of click event to parent svg
                            d3.event.stopPropagation();

                            // Broadcast the latest selection
//                            fireSelectionEvent();
                        }
                    }

                    function nodeLabelCallback(node) {
                        return node.id + COLON + SPACE + OPEN_SQUARE_BRACKET + node.type + CLOSE_SQUARE_BRACKET;
                    }

                    function imageResourceCallback(node) {
                        var kType = node.type;
                        var imgName ='';

                        for (var i = 0; i < kType.length; ++i) {
                            var c = kType.charAt(i);
                            if (i > 0 && c == c.toUpperCase())
                                imgName = imgName + HYPHEN;

                            imgName = imgName + c.toLowerCase();
                        }

                        var uri = vdbBench.imgPath + "/diagramming/" + imgName + ".png";

                        /*
                        * setAttribute will just set the attribute name to xlink:href and not
                        * treat it as a ns prefix.
                        */
                        this.setAttributeNS(XLINK_NAMESPACE, HTML_HREF, uri);
                        this.setAttribute(HTML_WIDTH, 32);
                        this.setAttribute(HTML_HEIGHT, 32);
                    }

                    /*
                     * If we have children then return the colour black else return white
                     * Used for the fill style in the circles beneath the images
                     */
                    function childStatusCallback(node) {
                        return (node.children != null || node._children != null) ? "#000" : "#fff";
                    }

                    /*
                     * Update all new, existing and outdated links
                     */
                    function updateLinks(source, nodes) {
                        /*
                         * Determine the array of links given the
                         * nodes provided to the layout
                         */
                        links = tree.links(nodes);

                        /*
                         * Update link paths for all new node locations
                         * Select all the svg links on the page that have a valid target
                         * in the links data. Links with an invalid target are those
                         * where the child has been collapsed away.
                         */
                        var linkSelection = svgGroup.selectAll(SVG_PATH + DOT + LINK)
                                                .data(links, function(link) {
                                                    return link.target.self;
                                                });

                        /*
                         * For all links not yet drawn, build an svg path using the
                         * co-ordinates of the source, ie. parent.
                         */
                        linkSelection.enter().insert(SVG_ELEMENT + COLON + SVG_PATH, GROUP_ELEMENT)
                                        .attr(CSS_CLASS, LINK)
                                        .attr(SVG_DATA_ELEMENT, function(link) {
                                            var o = {x: source.x0, y: source.y0};
                                            return diagonal({source: o, target: o});
                                        });

                        /*
                         * Starts an animtion of the link's svg data element using the path generator
                         */
                        linkSelection.transition().duration(TRANSITION_DURATION)
                                              .attr(SVG_DATA_ELEMENT, diagonal);

                        /*
                         * Removal of invalid links where their targets have been collapsed away
                         * Animate their removal by regenerating the link back to pointing their
                         * source and target to the source, ie. parent.
                         */
                        linkSelection.exit().transition().duration(TRANSITION_DURATION)
                                      .attr(SVG_DATA_ELEMENT, function(link) {
                                            var o = {x: source.x, y: source.y};
                                            return diagonal({source: o, target: o});
                                        }).remove();
                    }

                }); // End of scope.$watch(vdb ...)
            }
        };
    });

    return vdbBench;

})(vdbBench || {});